import { PoolClient } from 'pg';

type AuditStatus = 'success' | 'denied' | 'failed';

type WriteAuditLogInput = {
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  status: AuditStatus;
  ipAddress?: string | null;
};

export async function writeAuditLog(
  client: PoolClient,
  input: WriteAuditLogInput
): Promise<void> {
  await client.query(
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
    VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8)
    `,
    [
      input.userId ?? null,
      input.action,
      input.resourceType,
      input.resourceId ?? null,
      input.oldValue ? JSON.stringify(input.oldValue) : null,
      input.newValue ? JSON.stringify(input.newValue) : null,
      input.status,
      input.ipAddress ?? null,
    ]
  );
}
