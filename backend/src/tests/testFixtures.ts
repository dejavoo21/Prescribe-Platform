import { pool } from '../db/pool';

export type SeedFixtureIds = {
  adminUserId: string;
  doctorUserId: string;
  pharmacyUserId: string;
  patientUserId: string;
  doctorProfileId: string;
  pharmacyProfileId: string;
  patientProfileId: string;
  medicationId: string;
};

export async function getSeedFixtureIds(): Promise<SeedFixtureIds> {
  const adminUser = await pool.query(
    `SELECT id FROM users WHERE email = $1 LIMIT 1`,
    ['admin@prescribe.local']
  );

  const doctorUser = await pool.query(
    `SELECT id FROM users WHERE email = $1 LIMIT 1`,
    ['doctor@prescribe.local']
  );

  const pharmacyUser = await pool.query(
    `SELECT id FROM users WHERE email = $1 LIMIT 1`,
    ['pharmacy@prescribe.local']
  );

  const patientUser = await pool.query(
    `SELECT id FROM users WHERE email = $1 LIMIT 1`,
    ['patient@prescribe.local']
  );

  const doctorProfile = await pool.query(
    `SELECT id FROM doctors WHERE user_id = $1 LIMIT 1`,
    [doctorUser.rows[0].id]
  );

  const pharmacyProfile = await pool.query(
    `SELECT id FROM pharmacies WHERE user_id = $1 LIMIT 1`,
    [pharmacyUser.rows[0].id]
  );

  const patientProfile = await pool.query(
    `SELECT id FROM patients WHERE user_id = $1 LIMIT 1`,
    [patientUser.rows[0].id]
  );

  const medication = await pool.query(
    `SELECT id FROM medications ORDER BY created_at ASC LIMIT 1`
  );

  return {
    adminUserId: adminUser.rows[0].id,
    doctorUserId: doctorUser.rows[0].id,
    pharmacyUserId: pharmacyUser.rows[0].id,
    patientUserId: patientUser.rows[0].id,
    doctorProfileId: doctorProfile.rows[0].id,
    pharmacyProfileId: pharmacyProfile.rows[0].id,
    patientProfileId: patientProfile.rows[0].id,
    medicationId: medication.rows[0].id,
  };
}
