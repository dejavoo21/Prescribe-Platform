import pool from '../../db/pool';
import { ForbiddenError } from '../../lib/errors';
import { AuthUserContext } from '../../types/auth';

export interface LookupItem {
  id: string;
  label: string;
}

export class LookupsService {
  static async getPatientsForDoctor(actor: AuthUserContext): Promise<LookupItem[]> {
    if (actor.role !== 'doctor' || !actor.doctorProfileId) {
      throw new ForbiddenError('Only doctors can access patient lookups');
    }

    const result = await pool.query(
      `
      SELECT
        p.id,
        p.first_name,
        p.last_name,
        p.date_of_birth
      FROM patients p
      ORDER BY p.last_name ASC, p.first_name ASC
      `
    );

    return result.rows.map((row) => ({
      id: row.id,
      label: `${row.first_name} ${row.last_name} - ${row.date_of_birth}`,
    }));
  }

  static async getPharmacies(actor: AuthUserContext): Promise<LookupItem[]> {
    if (actor.role !== 'doctor' && actor.role !== 'pharmacy') {
      throw new ForbiddenError('Not allowed to access pharmacy lookups');
    }

    const result = await pool.query(
      `
      SELECT
        id,
        name
      FROM pharmacies
      WHERE is_active = true
      ORDER BY name ASC
      `
    );

    return result.rows.map((row) => ({
      id: row.id,
      label: row.name,
    }));
  }

  static async getMedications(actor: AuthUserContext, search?: string): Promise<LookupItem[]> {
    if (!['doctor', 'pharmacy'].includes(actor.role)) {
      throw new ForbiddenError('Not allowed to access medication lookups');
    }

    const values: unknown[] = [];
    let whereClause = `WHERE is_active = true`;

    if (search?.trim()) {
      values.push(`%${search.trim()}%`);
      whereClause += ` AND (name ILIKE $${values.length} OR generic_name ILIKE $${values.length})`;
    }

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        generic_name,
        strength
      FROM medications
      ${whereClause}
      ORDER BY name ASC
      LIMIT 50
      `,
      values
    );

    return result.rows.map((row) => ({
      id: row.id,
      label: `${row.name}${row.strength ? ` - ${row.strength}` : ''}${
        row.generic_name ? ` (${row.generic_name})` : ''
      }`,
    }));
  }
}
