import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { AuditLogEntry } from '../../types/audit';
import { getAuditLogs } from '../../lib/auditApi';

export function AdminAuditPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [params, setParams] = useState({
    action: '',
    userId: '',
    limit: '100',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const filterParams = {
          action: params.action || undefined,
          userId: params.userId || undefined,
          limit: params.limit ? parseInt(params.limit, 10) : undefined,
        };
        const result = await getAuditLogs(filterParams);
        setItems(result.data || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [user, navigate, params]);

  if (isLoading) return <div style={{ padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Audit Logs</h1>

      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          Error: {error}
        </div>
      )}

      {/* Filters */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5' }}>
        <div style={{ marginBottom: '10px' }}>
          <label>
            Action:
            <input
              type="text"
              value={params.action}
              onChange={(e) => setParams({ ...params, action: e.target.value })}
              placeholder="e.g., prescription.created"
              style={{ marginLeft: '5px', padding: '5px' }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label>
            User ID:
            <input
              type="text"
              value={params.userId}
              onChange={(e) => setParams({ ...params, userId: e.target.value })}
              placeholder="e.g., user-123"
              style={{ marginLeft: '5px', padding: '5px' }}
            />
          </label>
        </div>

        <div>
          <label>
            Limit:
            <input
              type="number"
              value={params.limit}
              onChange={(e) => setParams({ ...params, limit: e.target.value })}
              min="1"
              max="1000"
              style={{ marginLeft: '5px', padding: '5px', width: '100px' }}
            />
          </label>
        </div>
      </div>

      {/* Audit Logs Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '10px', textAlign: 'left' }}>Timestamp</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Action</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>User ID</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Resource</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>IP Address</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ padding: '20px', textAlign: 'center' }}>
                No audit logs found
              </td>
            </tr>
          ) : (
            items.map((log) => (
              <tr key={log.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '10px' }}>
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td style={{ padding: '10px' }}>{log.action}</td>
                <td style={{ padding: '10px' }}>
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: '3px',
                      backgroundColor:
                        log.status === 'success'
                          ? '#e8f5e9'
                          : log.status === 'error'
                            ? '#ffebee'
                            : '#f5f5f5',
                      color:
                        log.status === 'success'
                          ? '#2e7d32'
                          : log.status === 'error'
                            ? '#c62828'
                            : '#333',
                    }}
                  >
                    {log.status}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>{log.userId}</td>
                <td style={{ padding: '10px' }}>
                  {log.resourceType
                    ? `${log.resourceType}${log.resourceId ? `:${log.resourceId}` : ''}`
                    : '-'}
                </td>
                <td style={{ padding: '10px' }}>{log.ipAddress || '-'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
