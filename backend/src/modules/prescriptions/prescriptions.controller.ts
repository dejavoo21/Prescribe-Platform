import { Request, Response, NextFunction } from 'express';
import { PrescriptionsService } from './prescriptions.service';
import { BadRequestError } from '../../lib/errors';
import { AuthUserContext } from '../../types/auth';
import { CreatePrescriptionInput, SendPrescriptionInput } from './prescriptions.types';

export class PrescriptionsController {
  static async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const prescriptions = await PrescriptionsService.listForDoctor(req.user as AuthUserContext);
      res.status(200).json({ data: prescriptions });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input: CreatePrescriptionInput = {
        patientId: req.body.patientId?.trim(),
        medicationId: req.body.medicationId?.trim(),
        dosage: req.body.dosage?.trim(),
        frequency: req.body.frequency?.trim(),
        duration: req.body.duration?.trim(),
        pharmacyId: req.body.pharmacyId?.trim() || undefined,
        quantityPrescribed: req.body.quantityPrescribed || undefined,
        specialInstructions: req.body.specialInstructions?.trim() || undefined,
      };

      if (!input.patientId || !input.medicationId || !input.dosage || !input.frequency || !input.duration) {
        throw new BadRequestError('Missing required fields');
      }

      const prescription = await PrescriptionsService.createDraft(
        req.user as AuthUserContext,
        input,
        req.ip
      );

      res.status(201).json({ data: prescription });
    } catch (error) {
      next(error);
    }
  }

  static async sign(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id?.trim()) {
        throw new BadRequestError('Prescription ID is required');
      }

      const prescription = await PrescriptionsService.sign(
        req.user as AuthUserContext,
        id.trim(),
        req.ip
      );

      res.status(200).json({ data: prescription });
    } catch (error) {
      next(error);
    }
  }

  static async revertToDraft(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id?.trim()) {
        throw new BadRequestError('Prescription ID is required');
      }

      const prescription = await PrescriptionsService.revertToDraft(
        req.user as AuthUserContext,
        id.trim(),
        req.ip
      );

      res.status(200).json({ data: prescription });
    } catch (error) {
      next(error);
    }
  }

  static async send(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id?.trim()) {
        throw new BadRequestError('Prescription ID is required');
      }

      const input: SendPrescriptionInput = {
        pharmacyId: req.body.pharmacyId?.trim() || undefined,
      };

      const prescription = await PrescriptionsService.send(
        req.user as AuthUserContext,
        id.trim(),
        input,
        req.ip
      );

      res.status(200).json({ data: prescription });
    } catch (error) {
      next(error);
    }
  }

  static async listAssigned(req: Request, res: Response, next: NextFunction) {
    try {
      const prescriptions = await PrescriptionsService.listForPharmacy(req.user as AuthUserContext);
      res.status(200).json({ data: prescriptions });
    } catch (error) {
      next(error);
    }
  }

  static async receive(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id?.trim()) {
        throw new BadRequestError('Prescription ID is required');
      }

      const prescription = await PrescriptionsService.receive(
        req.user as AuthUserContext,
        id.trim(),
        req.ip
      );

      res.status(200).json({ data: prescription });
    } catch (error) {
      next(error);
    }
  }

  static async dispense(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id?.trim()) {
        throw new BadRequestError('Prescription ID is required');
      }

      const result = await PrescriptionsService.dispense(
        req.user as AuthUserContext,
        id.trim(),
        req.body ?? {},
        req.ip
      );

      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  static async listVisibleToPatient(req: Request, res: Response, next: NextFunction) {
    try {
      const prescriptions = await PrescriptionsService.listForPatient(req.user as AuthUserContext);
      res.status(200).json({ data: prescriptions });
    } catch (error) {
      next(error);
    }
  }

  static async discard(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id?.trim()) {
        throw new BadRequestError('Prescription ID is required');
      }

      const result = await PrescriptionsService.discard(
        req.user as AuthUserContext,
        id.trim(),
        req.ip
      );

      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!id?.trim()) {
        throw new BadRequestError('Prescription ID is required');
      }

      const result = await PrescriptionsService.cancel(
        req.user as AuthUserContext,
        id.trim(),
        req.body ?? {},
        req.ip
      );

      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }
}
