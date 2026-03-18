import pool from '../db/pool';

/**
 * Test fixtures helper - fetches seeded data from database
 * This ensures tests use real data from the seed script
 */

export class TestFixtures {
  static async getDoctorUser() {
    const result = await pool.query(
      `SELECT u.id, u.email, u.role, d.id as profile_id 
       FROM users u 
       LEFT JOIN doctors d ON u.id = d.user_id 
       WHERE u.email = 'doctor@prescribe.local'`
    );
    if (result.rows.length === 0) throw new Error('Doctor user not found in seed data');
    return result.rows[0];
  }

  static async getPharmacyUser() {
    const result = await pool.query(
      `SELECT u.id, u.email, u.role, p.id as profile_id 
       FROM users u 
       LEFT JOIN pharmacies p ON u.id = p.user_id 
       WHERE u.email = 'pharmacy@prescribe.local'`
    );
    if (result.rows.length === 0) throw new Error('Pharmacy user not found in seed data');
    return result.rows[0];
  }

  static async getPatientUser() {
    const result = await pool.query(
      `SELECT u.id, u.email, u.role, p.id as profile_id 
       FROM users u 
       LEFT JOIN patients p ON u.id = p.user_id 
       WHERE u.email = 'patient@prescribe.local'`
    );
    if (result.rows.length === 0) throw new Error('Patient user not found in seed data');
    return result.rows[0];
  }

  static async getAdminUser() {
    const result = await pool.query(
      `SELECT u.id, u.email, u.role 
       FROM users u 
       WHERE u.email = 'admin@prescribe.local'`
    );
    if (result.rows.length === 0) throw new Error('Admin user not found in seed data');
    return result.rows[0];
  }

  static async getPatientById(email: string) {
    const result = await pool.query(
      `SELECT p.id, p.first_name, p.last_name, p.date_of_birth, p.user_id
       FROM patients p
       JOIN users u ON p.user_id = u.id
       WHERE u.email = $1`,
      [email]
    );
    if (result.rows.length === 0) throw new Error(`Patient with email ${email} not found`);
    return result.rows[0];
  }

  static async getPharmacyById(email: string) {
    const result = await pool.query(
      `SELECT p.id, p.name, p.user_id
       FROM pharmacies p
       JOIN users u ON p.user_id = u.id
       WHERE u.email = $1`,
      [email]
    );
    if (result.rows.length === 0) throw new Error(`Pharmacy with email ${email} not found`);
    return result.rows[0];
  }

  static async getDoctorById(email: string) {
    const result = await pool.query(
      `SELECT d.id, d.license_number, d.user_id
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       WHERE u.email = $1`,
      [email]
    );
    if (result.rows.length === 0) throw new Error(`Doctor with email ${email} not found`);
    return result.rows[0];
  }

  static async getMedicationById(name?: string) {
    let query = `SELECT id, name, generic_name, strength FROM medications WHERE is_active = true`;
    const params: unknown[] = [];

    if (name) {
      query += ` AND name = $1`;
      params.push(name);
    }

    query += ` LIMIT 1`;

    const result = await pool.query(query, params);
    if (result.rows.length === 0) throw new Error('No active medication found');
    return result.rows[0];
  }
}
