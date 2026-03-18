import dotenv from 'dotenv';
import { Client } from 'pg';
import bcrypt from 'bcryptjs';

dotenv.config();

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  const password = 'ChangeMe123!';
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await client.query('BEGIN');

    // Clean seed order
    await client.query('DELETE FROM notifications');
    await client.query('DELETE FROM audit_logs');
    await client.query('DELETE FROM prescriptions');
    await client.query('DELETE FROM patients');
    await client.query('DELETE FROM pharmacies');
    await client.query('DELETE FROM doctors');
    await client.query('DELETE FROM medications');
    await client.query('DELETE FROM users');

    // Users
    const adminUser = await client.query(
      `
      INSERT INTO users (email, password_hash, role, is_active, email_verified)
      VALUES ($1, $2, 'admin', true, true)
      RETURNING id, email, role
      `,
      ['admin@prescribe.local', passwordHash]
    );

    const doctorUser = await client.query(
      `
      INSERT INTO users (email, password_hash, role, is_active, email_verified)
      VALUES ($1, $2, 'doctor', true, true)
      RETURNING id, email, role
      `,
      ['doctor@prescribe.local', passwordHash]
    );

    const pharmacyUser = await client.query(
      `
      INSERT INTO users (email, password_hash, role, is_active, email_verified)
      VALUES ($1, $2, 'pharmacy', true, true)
      RETURNING id, email, role
      `,
      ['pharmacy@prescribe.local', passwordHash]
    );

    const patientUser = await client.query(
      `
      INSERT INTO users (email, password_hash, role, is_active, email_verified)
      VALUES ($1, $2, 'patient', true, true)
      RETURNING id, email, role
      `,
      ['patient@prescribe.local', passwordHash]
    );

    const adminUserId = adminUser.rows[0].id;
    const doctorUserId = doctorUser.rows[0].id;
    const pharmacyUserId = pharmacyUser.rows[0].id;
    const patientUserId = patientUser.rows[0].id;

    // Doctor profile
    const doctor = await client.query(
      `
      INSERT INTO doctors (
        user_id, first_name, last_name, license_number, specialty, clinic_name, is_verified
      )
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id, first_name, last_name
      `,
      [
        doctorUserId,
        'Amina',
        'Dlamini',
        'DOC-10001',
        'Family Medicine',
        'Northside Medical Clinic',
      ]
    );

    const doctorId = doctor.rows[0].id;

    // Pharmacy profile
    const pharmacy = await client.query(
      `
      INSERT INTO pharmacies (
        user_id, name, license_number, phone, email,
        address_line_1, city, province, postal_code, is_verified, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, true)
      RETURNING id, name
      `,
      [
        pharmacyUserId,
        'Central Care Pharmacy',
        'PHARM-20001',
        '+1-555-0100',
        'pharmacy@prescribe.local',
        '100 Main Street',
        'Toronto',
        'ON',
        'M5V1K4',
      ]
    );

    const pharmacyId = pharmacy.rows[0].id;

    // Patient profile
    const patient = await client.query(
      `
      INSERT INTO patients (
        user_id, first_name, last_name, date_of_birth, phone,
        allergies, chronic_conditions, medication_history, preferred_pharmacy_id
      )
      VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::jsonb, $9)
      RETURNING id, first_name, last_name
      `,
      [
        patientUserId,
        'Lebo',
        'Mokoena',
        '1992-06-14',
        '+1-555-0200',
        JSON.stringify(['Penicillin']),
        JSON.stringify(['Asthma']),
        JSON.stringify([]),
        pharmacyId,
      ]
    );

    const patientId = patient.rows[0].id;

    // Medications
    const medication1 = await client.query(
      `
      INSERT INTO medications (
        name, generic_name, strength, form, din, manufacturer, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id, name
      `,
      [
        'Ventolin Inhaler',
        'Salbutamol',
        '100mcg',
        'Inhaler',
        'DIN-30001',
        'Demo Pharma Inc.',
      ]
    );

    // Second medication (not currently used in prescriptions)
    await client.query(
      `
      INSERT INTO medications (
        name, generic_name, strength, form, din, manufacturer, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id, name
      `,
      [
        'Amoxicillin',
        'Amoxicillin',
        '500mg',
        'Capsule',
        'DIN-30002',
        'Demo Pharma Inc.',
      ]
    );

    const medicationId = medication1.rows[0].id;

    // Sample draft prescription
    const prescription = await client.query(
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
      RETURNING id, status
      `,
      [
        doctorId,
        patientId,
        pharmacyId,
        medicationId,
        '2 puffs',
        'Every 6 hours as needed',
        '30 days',
        1,
        'Use for wheezing or shortness of breath',
      ]
    );

    const prescriptionId = prescription.rows[0].id;

    // Optional starter audit event
    await client.query(
      `
      INSERT INTO audit_logs (
        user_id, action, resource_type, resource_id, old_value, new_value, status, ip_address
      )
      VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8)
      `,
      [
        doctorUserId,
        'seed_prescription_created',
        'Prescription',
        prescriptionId,
        null,
        JSON.stringify({ status: 'DRAFTED' }),
        'success',
        '127.0.0.1',
      ]
    );

    await client.query('COMMIT');

    console.log('Seed complete.\n');
    console.log('Login accounts:');
    console.log('  admin@prescribe.local');
    console.log('  doctor@prescribe.local');
    console.log('  pharmacy@prescribe.local');
    console.log('  patient@prescribe.local');
    console.log(`  password: ${password}`);
    console.log('\nCreated records:');
    console.log(`  Admin user:    ${adminUserId}`);
    console.log(`  Doctor user:   ${doctorUserId}`);
    console.log(`  Doctor profile:${doctorId}`);
    console.log(`  Pharmacy user: ${pharmacyUserId}`);
    console.log(`  Pharmacy prof: ${pharmacyId}`);
    console.log(`  Patient user:  ${patientUserId}`);
    console.log(`  Patient prof:  ${patientId}`);
    console.log(`  Prescription:  ${prescriptionId}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seed failed:', error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Unexpected failure:', error);
  process.exit(1);
});
