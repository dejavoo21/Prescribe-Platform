import { pool } from '../db/pool';

type WriteDeniedAuditLogInput = {
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  reason?: string | null;
};

export async function writeDeniedAuditLog(
  input: WriteDeniedAuditLogInput
): Promise<void> {
  await pool.query(
    `
    INSERT INTO audit_logs (
      user_id,
      action,
      resource_type,
      resource_id,
      old_value,
      new_value,
      status,
      ip_address
    )
    VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, 'denied', $7)
    `,
    [
      input.userId ?? null,
      input.action,
      input.resourceType,
      input.resourceId ?? null,
      null,
      input.reason ? JSON.stringify({ reason: input.reason }) : null,
      input.ipAddress ?? null,
    ]
  );
}
