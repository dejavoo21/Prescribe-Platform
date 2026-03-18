import { pool } from '../../db/pool';
import { ForbiddenError } from '../../lib/errors';
import { AuthUserContext } from '../../types/auth';

type ListAuditLogsInput = {
  from?: string;
  to?: string;
  action?: string;
  userId?: string;
  limit?: number;
};

export class AuditService {
  static async listAuditLogs(actor: AuthUserContext, input: ListAuditLogsInput) {
    if (actor.role !== 'admin') {
      throw new ForbiddenError('Only admins can view audit logs');
    }

    const values: unknown[] = [];
    const where: string[] = [];

    if (input.from) {
      values.push(input.from);
      where.push(`created_at >= $${values.length}`);
    }

    if (input.to) {
      values.push(input.to);
      where.push(`created_at <= $${values.length}`);
    }

    if (input.action) {
      values.push(input.action);
      where.push(`action = $${values.length}`);
    }

    if (input.userId) {
      values.push(input.userId);
      where.push(`user_id = $${values.length}`);
    }

    const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);
    values.push(limit);

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const result = await pool.query(
      `
      SELECT
        id,
        user_id,
        action,
        resource_type,
        resource_id,
        status,
        ip_address,
        created_at
      FROM audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${values.length}
      `,
      values
    );

    return result.rows;
  }
}
