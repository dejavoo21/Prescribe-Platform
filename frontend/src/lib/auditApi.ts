import { apiFetch } from './api';
import { AuditLogEntry } from '../types/audit';

type ApiResponse<T> = {
  data: T;
};

export interface AuditLogsParams {
  from?: string;
  to?: string;
  action?: string;
  userId?: string;
  limit?: number;
}

export async function getAuditLogs(params?: AuditLogsParams) {
  const search = new URLSearchParams();
  if (params?.from) search.set('from', params.from);
  if (params?.to) search.set('to', params.to);
  if (params?.action) search.set('action', params.action);
  if (params?.userId) search.set('userId', params.userId);
  if (params?.limit) search.set('limit', String(params.limit));

  const url = `/audit${search.toString() ? `?${search.toString()}` : ''}`;
  return apiFetch<ApiResponse<AuditLogEntry[]>>(url);
}
