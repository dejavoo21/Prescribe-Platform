import { PoolClient } from 'pg';
import { pool } from '../../db/pool';
import { writeAuditLog } from '../../lib/audit';
import { writeDeniedAuditLog } from '../../lib/auditDenied';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from '../../lib/errors';
import { AuthUserContext } from '../../types/auth';
import {
  CreatePrescriptionInput,
  SendPrescriptionInput,
} from './prescriptions.types';

function getIpAddress(ip?: string): string | null {
  return ip ?? null;
}

export class PrescriptionsService {
  static async createDraft(
    actor: AuthUserContext,
    input: CreatePrescriptionInput,
    ipAddress?: string
  ) {
    if (actor.role !== 'doctor' || !actor.doctorProfileId) {
      throw new ForbiddenError('Only doctors can create prescriptions');
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      await this.assertPatientExists(client, input.patientId);
      await this.assertMedicationExists(client, input.medicationId);

      const pharmacyId =
        input.pharmacyId ?? (await this.getPreferredPharmacyId(client, input.patientId));

      if (!pharmacyId) {
        throw new BadRequestError('A pharmacy must be selected or resolvable');
      }

      await this.assertPharmacyIsActive(client, pharmacyId);

      const result = await client.query(
        `
        INSERT INTO prescriptions (
          doctor_id,
          patient_id,
          pharmacy_id,
          medication_id,
          status,
          dosage,
          frequency,
          duration,
          quantity_prescribed,
          special_instructions
        )
        VALUES ($1, $2, $3, $4, 'DRAFTED', $5, $6, $7, $8, $9)
        RETURNING
          id,
          doctor_id,
          patient_id,
          pharmacy_id,
          medication_id,
          status,
          dosage,
          frequency,
          duration,
          quantity_prescribed,
          special_instructions,
          created_at,
          updated_at
        `,
        [
          actor.doctorProfileId,
          input.patientId,
          pharmacyId,
          input.medicationId,
          input.dosage.trim(),
          input.frequency.trim(),
          input.duration.trim(),
          input.quantityPrescribed ?? null,
          input.specialInstructions?.trim() || null,
        ]
      );

      const prescription = result.rows[0];

      await writeAuditLog(client, {
        userId: actor.userId,
        action: 'prescription_created',
        resourceType: 'Prescription',
        resourceId: prescription.id,
        oldValue: null,
        newValue: { status: 'DRAFTED' },
        status: 'success',
        ipAddress: getIpAddress(ipAddress),
      });

      await client.query('COMMIT');
      return prescription;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async sign(
    actor: AuthUserContext,
    prescriptionId: string,
    ipAddress?: string
  ) {
    if (actor.role !== 'doctor' || !actor.doctorProfileId) {
      throw new ForbiddenError('Only doctors can sign prescriptions');
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const existing = await this.getOwnedPrescriptionOrThrow(
        client,
        prescriptionId,
        actor.doctorProfileId,
        actor.userId,
        getIpAddress(ipAddress)
      );

      if (existing.status !== 'DRAFTED') {
        await writeDeniedAuditLog({
          userId: actor.userId,
          action: 'prescription_sign_denied',
          resourceType: 'Prescription',
          resourceId: prescriptionId,
          ipAddress: getIpAddress(ipAddress),
          reason: `Invalid status ${existing.status}`,
        });

        throw new BadRequestError('Only drafted prescriptions can be signed');
      }

      const result = await client.query(
        `
        UPDATE prescriptions
        SET
          status = 'SIGNED',
          signed_at = NOW(),
          version = version + 1,
          updated_at = NOW()
        WHERE id = $1
          AND doctor_id = $2
          AND status = 'DRAFTED'
        RETURNING id, status, signed_at, updated_at, version
        `,
        [prescriptionId, actor.doctorProfileId]
      );

      if (result.rowCount === 0) {
        throw new BadRequestError('Prescription could not be signed');
      }

      await writeAuditLog(client, {
        userId: actor.userId,
        action: 'prescription_signed',
        resourceType: 'Prescription',
        resourceId: prescriptionId,
        oldValue: { status: 'DRAFTED' },
        newValue: { status: 'SIGNED' },
        status: 'success',
        ipAddress: getIpAddress(ipAddress),
      });

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async revertToDraft(
    actor: AuthUserContext,
    prescriptionId: string,
    ipAddress?: string
  ) {
    if (actor.role !== 'doctor' || !actor.doctorProfileId) {
      throw new ForbiddenError('Only doctors can revert prescriptions');
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const existing = await this.getOwnedPrescriptionOrThrow(
        client,
        prescriptionId,
        actor.doctorProfileId,
        actor.userId,
        getIpAddress(ipAddress)
      );

      if (existing.status !== 'SIGNED') {
        await writeDeniedAuditLog({
          userId: actor.userId,
          action: 'prescription_revert_denied',
          resourceType: 'Prescription',
          resourceId: prescriptionId,
          ipAddress: getIpAddress(ipAddress),
          reason: `Invalid status ${existing.status}`,
        });

        throw new BadRequestError('Only signed prescriptions can be reverted');
      }

      const result = await client.query(
        `
        UPDATE prescriptions
        SET
          status = 'DRAFTED',
          signed_at = NULL,
          version = version + 1,
          updated_at = NOW()
        WHERE id = $1
          AND doctor_id = $2
          AND status = 'SIGNED'
        RETURNING id, status, signed_at, updated_at, version
        `,
        [prescriptionId, actor.doctorProfileId]
      );

      if (result.rowCount === 0) {
        throw new BadRequestError('Prescription could not be reverted');
      }

      await writeAuditLog(client, {
        userId: actor.userId,
        action: 'prescription_reverted_to_draft',
        resourceType: 'Prescription',
        resourceId: prescriptionId,
        oldValue: { status: 'SIGNED' },
        newValue: { status: 'DRAFTED' },
        status: 'success',
        ipAddress: getIpAddress(ipAddress),
      });

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async send(
    actor: AuthUserContext,
    prescriptionId: string,
    input: SendPrescriptionInput,
    ipAddress?: string
  ) {
    if (actor.role !== 'doctor' || !actor.doctorProfileId) {
      throw new ForbiddenError('Only doctors can send prescriptions');
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const existing = await this.getOwnedPrescriptionOrThrow(
        client,
        prescriptionId,
        actor.doctorProfileId,
        actor.userId,
        getIpAddress(ipAddress)
      );

      if (existing.status !== 'SIGNED') {
        await writeDeniedAuditLog({
          userId: actor.userId,
          action: 'prescription_send_denied',
          resourceType: 'Prescription',
          resourceId: prescriptionId,
          ipAddress: getIpAddress(ipAddress),
          reason: `Invalid status ${existing.status}`,
        });

        throw new BadRequestError('Only signed prescriptions can be sent');
      }

      const resolvedPharmacyId = input.pharmacyId ?? existing.pharmacy_id;
      if (!resolvedPharmacyId) {
        throw new BadRequestError('Pharmacy is required before sending');
      }

      await this.assertPharmacyIsActive(client, resolvedPharmacyId);

      const result = await client.query(
        `
        UPDATE prescriptions
        SET
          pharmacy_id = $1,
          status = 'SENT',
          sent_at = NOW(),
          version = version + 1,
          updated_at = NOW()
        WHERE id = $2
          AND doctor_id = $3
          AND status = 'SIGNED'
        RETURNING
          id,
          doctor_id,
          patient_id,
          pharmacy_id,
          medication_id,
          status,
          sent_at,
          updated_at,
          version
        `,
        [resolvedPharmacyId, prescriptionId, actor.doctorProfileId]
      );

      if (result.rowCount === 0) {
        throw new BadRequestError('Prescription could not be sent');
      }

      const updated = result.rows[0];

      const patientUserId = await this.getPatientUserId(client, updated.patient_id);
      const pharmacyUserId = await this.getPharmacyUserId(client, updated.pharmacy_id);

      if (patientUserId) {
        await this.createNotification(client, {
          userId: patientUserId,
          type: 'prescription_sent',
          title: 'Prescription sent',
          message: 'Your prescription has been sent to the pharmacy.',
          relatedResourceType: 'Prescription',
          relatedResourceId: prescriptionId,
        });
      }

      if (pharmacyUserId) {
        await this.createNotification(client, {
          userId: pharmacyUserId,
          type: 'prescription_incoming',
          title: 'New prescription received',
          message: 'A new prescription has been sent to your pharmacy.',
          relatedResourceType: 'Prescription',
          relatedResourceId: prescriptionId,
        });
      }

      await writeAuditLog(client, {
        userId: actor.userId,
        action: 'prescription_sent',
        resourceType: 'Prescription',
        resourceId: prescriptionId,
        oldValue: { status: 'SIGNED' },
        newValue: {
          status: 'SENT',
          pharmacy_id: resolvedPharmacyId,
        },
        status: 'success',
        ipAddress: getIpAddress(ipAddress),
      });

      await client.query('COMMIT');
      return updated;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async listForDoctor(actor: AuthUserContext) {
    if (actor.role !== 'doctor' || !actor.doctorProfileId) {
      throw new ForbiddenError('Only doctors can list doctor prescriptions');
    }

    const result = await pool.query(
      `
      SELECT
        rx.id,
        rx.patient_id,
        rx.pharmacy_id,
        rx.medication_id,
        rx.status,
        rx.dosage,
        rx.frequency,
        rx.duration,
        rx.quantity_prescribed,
        rx.special_instructions,
        rx.created_at,
        rx.signed_at,
        rx.sent_at,
        rx.updated_at,

        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,

        ph.name AS pharmacy_name,

        m.name AS medication_name,
        m.strength AS medication_strength
      FROM prescriptions rx
      INNER JOIN patients p ON p.id = rx.patient_id
      LEFT JOIN pharmacies ph ON ph.id = rx.pharmacy_id
      INNER JOIN medications m ON m.id = rx.medication_id
      WHERE rx.doctor_id = $1
      ORDER BY rx.created_at DESC
      `,
      [actor.doctorProfileId]
    );

    return result.rows;
  }

  private static async getOwnedPrescriptionOrThrow(
    client: PoolClient,
    prescriptionId: string,
    doctorProfileId: string,
    userId?: string,
    ipAddress?: string
  ) {
    const result = await client.query(
      `
      SELECT
        id,
        doctor_id,
        patient_id,
        pharmacy_id,
        medication_id,
        status,
        version
      FROM prescriptions
      WHERE id = $1
        AND doctor_id = $2
      LIMIT 1
      `,
      [prescriptionId, doctorProfileId]
    );

    const prescription = result.rows[0];
    if (!prescription) {
      if (userId) {
        await writeDeniedAuditLog({
          userId,
          action: 'prescription_access_denied',
          resourceType: 'Prescription',
          resourceId: prescriptionId,
          ipAddress,
          reason: 'Prescription not owned by doctor',
        });
      }

      throw new NotFoundError('Prescription not found');
    }

    return prescription;
  }

  private static async assertPatientExists(client: PoolClient, patientId: string) {
    const result = await client.query(
      `SELECT id FROM patients WHERE id = $1 LIMIT 1`,
      [patientId]
    );

    if (result.rowCount === 0) {
      throw new BadRequestError('Patient not found');
    }
  }

  private static async assertMedicationExists(client: PoolClient, medicationId: string) {
    const result = await client.query(
      `SELECT id FROM medications WHERE id = $1 AND is_active = true LIMIT 1`,
      [medicationId]
    );

    if (result.rowCount === 0) {
      throw new BadRequestError('Medication not found');
    }
  }

  private static async assertPharmacyIsActive(client: PoolClient, pharmacyId: string) {
    const result = await client.query(
      `
      SELECT id
      FROM pharmacies
      WHERE id = $1
        AND is_active = true
      LIMIT 1
      `,
      [pharmacyId]
    );

    if (result.rowCount === 0) {
      throw new BadRequestError('Pharmacy not found or inactive');
    }
  }

  private static async getPreferredPharmacyId(
    client: PoolClient,
    patientId: string
  ): Promise<string | null> {
    const result = await client.query(
      `
      SELECT preferred_pharmacy_id
      FROM patients
      WHERE id = $1
      LIMIT 1
      `,
      [patientId]
    );

    return result.rows[0]?.preferred_pharmacy_id ?? null;
  }

  private static async getPatientUserId(
    client: PoolClient,
    patientId: string
  ): Promise<string | null> {
    const result = await client.query(
      `
      SELECT user_id
      FROM patients
      WHERE id = $1
      LIMIT 1
      `,
      [patientId]
    );

    return result.rows[0]?.user_id ?? null;
  }

  private static async getPharmacyUserId(
    client: PoolClient,
    pharmacyId: string
  ): Promise<string | null> {
    const result = await client.query(
      `
      SELECT user_id
      FROM pharmacies
      WHERE id = $1
      LIMIT 1
      `,
      [pharmacyId]
    );

    return result.rows[0]?.user_id ?? null;
  }

  private static async createNotification(
    client: PoolClient,
    input: {
      userId: string;
      type: string;
      title: string;
      message: string;
      relatedResourceType?: string | null;
      relatedResourceId?: string | null;
    }
  ) {
    await client.query(
      `
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        related_resource_type,
        related_resource_id
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        input.userId,
        input.type,
        input.title,
        input.message,
        input.relatedResourceType ?? null,
        input.relatedResourceId ?? null,
      ]
    );
  }

  static async listForPharmacy(actor: AuthUserContext) {
    if (actor.role !== 'pharmacy' || !actor.pharmacyProfileId) {
      throw new ForbiddenError('Only pharmacies can list pharmacy prescriptions');
    }

    const result = await pool.query(
      `
      SELECT
        rx.id,
        rx.doctor_id,
        rx.patient_id,
        rx.pharmacy_id,
        rx.medication_id,
        rx.status,
        rx.dosage,
        rx.frequency,
        rx.duration,
        rx.quantity_prescribed,
        rx.sent_at,
        rx.received_at,
        rx.dispensed_at,
        rx.updated_at,

        p.first_name AS patient_first_name,
        p.last_name AS patient_last_name,

        d.first_name AS doctor_first_name,
        d.last_name AS doctor_last_name,

        m.name AS medication_name,
        m.strength AS medication_strength
      FROM prescriptions rx
      INNER JOIN patients p ON p.id = rx.patient_id
      INNER JOIN doctors d ON d.id = rx.doctor_id
      INNER JOIN medications m ON m.id = rx.medication_id
      WHERE rx.pharmacy_id = $1
        AND rx.status IN ('SENT', 'RECEIVED', 'DISPENSED', 'CANCELLED', 'EXPIRED')
      ORDER BY rx.created_at DESC
      `,
      [actor.pharmacyProfileId]
    );

    return result.rows;
  }

  static async receive(
    actor: AuthUserContext,
    prescriptionId: string,
    ipAddress?: string
  ) {
    if (actor.role !== 'pharmacy' || !actor.pharmacyProfileId) {
      throw new ForbiddenError('Only pharmacies can receive prescriptions');
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const existing = await this.getAssignedPrescriptionOrThrow(
        client,
        prescriptionId,
        actor.pharmacyProfileId,
        actor.userId,
        getIpAddress(ipAddress)
      );

      if (existing.status !== 'SENT') {
        await writeDeniedAuditLog({
          userId: actor.userId,
          action: 'prescription_receive_denied',
          resourceType: 'Prescription',
          resourceId: prescriptionId,
          ipAddress: getIpAddress(ipAddress),
          reason: `Invalid status ${existing.status}`,
        });

        throw new BadRequestError('Only sent prescriptions can be received');
      }

      const result = await client.query(
        `
        UPDATE prescriptions
        SET
          status = 'RECEIVED',
          received_at = NOW(),
          version = version + 1,
          updated_at = NOW()
        WHERE id = $1
          AND pharmacy_id = $2
          AND status = 'SENT'
        RETURNING
          id,
          doctor_id,
          patient_id,
          pharmacy_id,
          medication_id,
          status,
          received_at,
          updated_at,
          version
        `,
        [prescriptionId, actor.pharmacyProfileId]
      );

      if (result.rowCount === 0) {
        throw new BadRequestError('Prescription could not be received');
      }

      const updated = result.rows[0];
      const patientUserId = await this.getPatientUserId(client, updated.patient_id);
      const doctorUserId = await this.getDoctorUserId(client, updated.doctor_id);

      if (patientUserId) {
        await this.createNotification(client, {
          userId: patientUserId,
          type: 'prescription_received',
          title: 'Prescription confirmed',
          message: 'The pharmacy has confirmed receipt of your prescription.',
          relatedResourceType: 'Prescription',
          relatedResourceId: prescriptionId,
        });
      }

      if (doctorUserId) {
        await this.createNotification(client, {
          userId: doctorUserId,
          type: 'prescription_received_by_pharmacy',
          title: 'Prescription received by pharmacy',
          message: 'The pharmacy has confirmed receipt of the prescription.',
          relatedResourceType: 'Prescription',
          relatedResourceId: prescriptionId,
        });
      }

      await writeAuditLog(client, {
        userId: actor.userId,
        action: 'prescription_received',
        resourceType: 'Prescription',
        resourceId: prescriptionId,
        oldValue: { status: 'SENT' },
        newValue: { status: 'RECEIVED' },
        status: 'success',
        ipAddress: getIpAddress(ipAddress),
      });

      await client.query('COMMIT');
      return updated;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async dispense(
    actor: AuthUserContext,
    prescriptionId: string,
    input: {
      quantityDispensed?: number | null;
      lotNumber?: string | null;
      expirationDate?: string | null;
    },
    ipAddress?: string
  ) {
    if (actor.role !== 'pharmacy' || !actor.pharmacyProfileId) {
      throw new ForbiddenError('Only pharmacies can dispense prescriptions');
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const existing = await this.getAssignedPrescriptionOrThrow(
        client,
        prescriptionId,
        actor.pharmacyProfileId,
        actor.userId,
        getIpAddress(ipAddress)
      );

      if (existing.status !== 'RECEIVED') {
        await writeDeniedAuditLog({
          userId: actor.userId,
          action: 'prescription_dispense_denied',
          resourceType: 'Prescription',
          resourceId: prescriptionId,
          ipAddress: getIpAddress(ipAddress),
          reason: `Invalid status ${existing.status}`,
        });

        throw new BadRequestError('Only received prescriptions can be dispensed');
      }

      const result = await client.query(
        `
        UPDATE prescriptions
        SET
          status = 'DISPENSED',
          quantity_dispensed = $1,
          lot_number = $2,
          medication_expiration_date = $3,
          dispensed_at = NOW(),
          version = version + 1,
          updated_at = NOW()
        WHERE id = $4
          AND pharmacy_id = $5
          AND status = 'RECEIVED'
        RETURNING
          id,
          doctor_id,
          patient_id,
          pharmacy_id,
          medication_id,
          status,
          quantity_dispensed,
          lot_number,
          medication_expiration_date,
          dispensed_at,
          updated_at,
          version
        `,
        [
          input.quantityDispensed ?? null,
          input.lotNumber?.trim() || null,
          input.expirationDate || null,
          prescriptionId,
          actor.pharmacyProfileId,
        ]
      );

      if (result.rowCount === 0) {
        throw new BadRequestError('Prescription could not be dispensed');
      }

      const updated = result.rows[0];
      const patientUserId = await this.getPatientUserId(client, updated.patient_id);

      if (patientUserId) {
        await this.createNotification(client, {
          userId: patientUserId,
          type: 'prescription_dispensed',
          title: 'Prescription ready',
          message: 'Your medication is ready for pickup.',
          relatedResourceType: 'Prescription',
          relatedResourceId: prescriptionId,
        });
      }

      await writeAuditLog(client, {
        userId: actor.userId,
        action: 'prescription_dispensed',
        resourceType: 'Prescription',
        resourceId: prescriptionId,
        oldValue: { status: 'RECEIVED' },
        newValue: {
          status: 'DISPENSED',
          quantity_dispensed: input.quantityDispensed ?? null,
        },
        status: 'success',
        ipAddress: getIpAddress(ipAddress),
      });

      await client.query('COMMIT');
      return updated;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private static async getAssignedPrescriptionOrThrow(
    client: PoolClient,
    prescriptionId: string,
    pharmacyProfileId: string,
    userId?: string,
    ipAddress?: string
  ) {
    const result = await client.query(
      `
      SELECT
        id,
        doctor_id,
        patient_id,
        pharmacy_id,
        medication_id,
        status,
        version
      FROM prescriptions
      WHERE id = $1
        AND pharmacy_id = $2
      LIMIT 1
      `,
      [prescriptionId, pharmacyProfileId]
    );

    const prescription = result.rows[0];
    if (!prescription) {
      if (userId) {
        await writeDeniedAuditLog({
          userId,
          action: 'prescription_access_denied',
          resourceType: 'Prescription',
          resourceId: prescriptionId,
          ipAddress,
          reason: 'Prescription not assigned to pharmacy',
        });
      }

      throw new NotFoundError('Prescription not found');
    }

    return prescription;
  }

  private static async getDoctorUserId(
    client: PoolClient,
    doctorId: string
  ): Promise<string | null> {
    const result = await client.query(
      `
      SELECT user_id
      FROM doctors
      WHERE id = $1
      LIMIT 1
      `,
      [doctorId]
    );

    return result.rows[0]?.user_id ?? null;
  }

  static async listForPatient(actor: AuthUserContext) {
    if (actor.role !== 'patient' || !actor.patientProfileId) {
      throw new ForbiddenError('Only patients can list patient prescriptions');
    }

    const result = await pool.query(
      `
      SELECT
        rx.id,
        rx.doctor_id,
        rx.pharmacy_id,
        rx.medication_id,
        rx.status,
        rx.dosage,
        rx.frequency,
        rx.duration,
        rx.quantity_prescribed,
        rx.quantity_dispensed,
        rx.special_instructions,
        rx.sent_at,
        rx.received_at,
        rx.dispensed_at,
        rx.cancelled_at,
        rx.expired_at,
        rx.created_at,
        rx.updated_at,

        ph.name AS pharmacy_name,

        m.name AS medication_name,
        m.strength AS medication_strength
      FROM prescriptions rx
      LEFT JOIN pharmacies ph ON ph.id = rx.pharmacy_id
      INNER JOIN medications m ON m.id = rx.medication_id
      WHERE rx.patient_id = $1
        AND rx.status IN ('SENT', 'RECEIVED', 'DISPENSED', 'CANCELLED', 'EXPIRED')
      ORDER BY rx.created_at DESC
      `,
      [actor.patientProfileId]
    );

    return result.rows;
  }

  static async discard(
    actor: AuthUserContext,
    prescriptionId: string,
    ipAddress?: string
  ) {
    if (actor.role !== 'doctor' || !actor.doctorProfileId) {
      throw new ForbiddenError('Only doctors can discard prescriptions');
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const existing = await this.getOwnedPrescriptionOrThrow(
        client,
        prescriptionId,
        actor.doctorProfileId,
        actor.userId,
        getIpAddress(ipAddress)
      );

      if (existing.status !== 'DRAFTED') {
        await writeDeniedAuditLog({
          userId: actor.userId,
          action: 'prescription_discard_denied',
          resourceType: 'Prescription',
          resourceId: prescriptionId,
          ipAddress: getIpAddress(ipAddress),
          reason: `Invalid status ${existing.status}`,
        });

        throw new BadRequestError('Only drafted prescriptions can be discarded');
      }

      const result = await client.query(
        `
        UPDATE prescriptions
        SET
          status = 'DISCARDED',
          discarded_at = NOW(),
          version = version + 1,
          updated_at = NOW()
        WHERE id = $1
          AND doctor_id = $2
          AND status = 'DRAFTED'
        RETURNING id, status, discarded_at, updated_at, version
        `,
        [prescriptionId, actor.doctorProfileId]
      );

      if (result.rowCount === 0) {
        throw new BadRequestError('Prescription could not be discarded');
      }

      await writeAuditLog(client, {
        userId: actor.userId,
        action: 'prescription_discarded',
        resourceType: 'Prescription',
        resourceId: prescriptionId,
        oldValue: { status: 'DRAFTED' },
        newValue: { status: 'DISCARDED' },
        status: 'success',
        ipAddress: getIpAddress(ipAddress),
      });

      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async cancel(
    actor: AuthUserContext,
    prescriptionId: string,
    input: {
      cancellationReasonCode: string;
      cancellationNote?: string | null;
    },
    ipAddress?: string
  ) {
    if (!input.cancellationReasonCode?.trim()) {
      throw new BadRequestError('cancellationReasonCode is required');
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const prescription = await client.query(
        `
        SELECT
          id,
          doctor_id,
          patient_id,
          pharmacy_id,
          status
        FROM prescriptions
        WHERE id = $1
        LIMIT 1
        `,
        [prescriptionId]
      );

      const existing = prescription.rows[0];
      if (!existing) {
        throw new NotFoundError('Prescription not found');
      }

      if (actor.role === 'doctor') {
        if (!actor.doctorProfileId || existing.doctor_id !== actor.doctorProfileId) {
          await writeDeniedAuditLog({
            userId: actor.userId,
            action: 'prescription_access_denied',
            resourceType: 'Prescription',
            resourceId: prescriptionId,
            ipAddress: getIpAddress(ipAddress),
            reason: 'Prescription not owned by doctor',
          });

          throw new ForbiddenError('Not your prescription');
        }

        if (!['SIGNED', 'SENT', 'RECEIVED'].includes(existing.status)) {
          await writeDeniedAuditLog({
            userId: actor.userId,
            action: 'prescription_cancel_denied',
            resourceType: 'Prescription',
            resourceId: prescriptionId,
            ipAddress: getIpAddress(ipAddress),
            reason: `Invalid status ${existing.status}`,
          });

          throw new BadRequestError(
            'Doctors may cancel only SIGNED, SENT, or RECEIVED prescriptions'
          );
        }
      } else if (actor.role === 'pharmacy') {
        if (!actor.pharmacyProfileId || existing.pharmacy_id !== actor.pharmacyProfileId) {
          await writeDeniedAuditLog({
            userId: actor.userId,
            action: 'prescription_access_denied',
            resourceType: 'Prescription',
            resourceId: prescriptionId,
            ipAddress: getIpAddress(ipAddress),
            reason: 'Prescription not assigned to pharmacy',
          });

          throw new ForbiddenError('Not assigned to your pharmacy');
        }

        if (!['SENT', 'RECEIVED'].includes(existing.status)) {
          await writeDeniedAuditLog({
            userId: actor.userId,
            action: 'prescription_cancel_denied',
            resourceType: 'Prescription',
            resourceId: prescriptionId,
            ipAddress: getIpAddress(ipAddress),
            reason: `Invalid status ${existing.status}`,
          });

          throw new BadRequestError(
            'Pharmacies may cancel only SENT or RECEIVED prescriptions'
          );
        }
      } else {
        throw new ForbiddenError('Only doctors or pharmacies can cancel prescriptions');
      }

      const result = await client.query(
        `
        UPDATE prescriptions
        SET
          status = 'CANCELLED',
          cancelled_at = NOW(),
          cancelled_by_user_id = $1,
          cancelled_by_role = $2,
          cancellation_reason_code = $3,
          cancellation_note = $4,
          version = version + 1,
          updated_at = NOW()
        WHERE id = $5
          AND status = $6
        RETURNING
          id,
          doctor_id,
          patient_id,
          pharmacy_id,
          status,
          cancelled_at,
          cancelled_by_user_id,
          cancelled_by_role,
          cancellation_reason_code,
          cancellation_note,
          updated_at,
          version
        `,
        [
          actor.userId,
          actor.role,
          input.cancellationReasonCode.trim(),
          input.cancellationNote?.trim() || null,
          prescriptionId,
          existing.status,
        ]
      );

      if (result.rowCount === 0) {
        throw new BadRequestError('Prescription could not be cancelled');
      }

      const updated = result.rows[0];

      const patientUserId = await this.getPatientUserId(client, updated.patient_id);
      const doctorUserId = await this.getDoctorUserId(client, updated.doctor_id);
      const pharmacyUserId = updated.pharmacy_id
        ? await this.getPharmacyUserId(client, updated.pharmacy_id)
        : null;

      if (patientUserId) {
        await this.createNotification(client, {
          userId: patientUserId,
          type: 'prescription_cancelled',
          title: 'Prescription cancelled',
          message: 'Your prescription has been cancelled.',
          relatedResourceType: 'Prescription',
          relatedResourceId: prescriptionId,
        });
      }

      if (doctorUserId && doctorUserId !== actor.userId) {
        await this.createNotification(client, {
          userId: doctorUserId,
          type: 'prescription_cancelled',
          title: 'Prescription cancelled',
          message: 'A prescription has been cancelled.',
          relatedResourceType: 'Prescription',
          relatedResourceId: prescriptionId,
        });
      }

      if (pharmacyUserId && pharmacyUserId !== actor.userId) {
        await this.createNotification(client, {
          userId: pharmacyUserId,
          type: 'prescription_cancelled',
          title: 'Prescription cancelled',
          message: 'A prescription has been cancelled.',
          relatedResourceType: 'Prescription',
          relatedResourceId: prescriptionId,
        });
      }

      await writeAuditLog(client, {
        userId: actor.userId,
        action: 'prescription_cancelled',
        resourceType: 'Prescription',
        resourceId: prescriptionId,
        oldValue: { status: existing.status },
        newValue: {
          status: 'CANCELLED',
          cancellation_reason_code: input.cancellationReasonCode.trim(),
          cancelled_by_role: actor.role,
        },
        status: 'success',
        ipAddress: getIpAddress(ipAddress),
      });

      await client.query('COMMIT');
      return updated;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
