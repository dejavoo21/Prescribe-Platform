export interface AuditLogEntry {
  id: string;
  createdAt: string;
  action: string;
  status: string;
  userId: string;
  resourceType?: string | null;
  resourceId?: string | null;
  ipAddress?: string | null;
}
