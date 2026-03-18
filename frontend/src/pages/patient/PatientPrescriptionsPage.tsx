import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { Prescription } from '../../types/prescriptions';
import { getVisiblePatientPrescriptions } from '../../lib/prescriptionsApi';
import { joinName } from '../../lib/display';

function getPatientStatusLabel(status: Prescription['status']) {
  switch (status) {
    case 'SENT':
      return 'Pending with pharmacy';
    case 'RECEIVED':
      return 'Confirmed by pharmacy';
    case 'DISPENSED':
      return 'Ready for pickup';
    case 'CANCELLED':
      return 'Cancelled';
    case 'EXPIRED':
      return 'Expired';
    default:
      return status;
  }
}

export function PatientPrescriptionsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getVisiblePatientPrescriptions();
        setItems(result.data || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [user, navigate]);

  if (isLoading) return <div style={{ padding: '20px' }}>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>My Prescriptions</h1>

      {error && (
        <div style={{ color: 'red', marginBottom: '10px' }}>
          Error: {error}
        </div>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: '10px', textAlign: 'left' }}>Prescription ID</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Medication</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Pharmacy</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Patient View</th>
            <th style={{ padding: '10px', textAlign: 'left' }}>Updated</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ padding: '20px', textAlign: 'center' }}>
                No prescriptions visible yet
              </td>
            </tr>
          ) : (
            items.map((rx) => (
              <tr
                key={rx.id}
                style={{
                  borderBottom: '1px solid #eee',
                  backgroundColor: rx.status === 'DISPENSED' ? '#f0f8f0' : 'white',
                }}
              >
                <td style={{ padding: '10px' }}>{rx.id}</td>
                <td style={{ padding: '10px' }}>
                  {rx.medication_name}
                  {rx.medication_strength ? ` - ${rx.medication_strength}` : ''}
                </td>
                <td style={{ padding: '10px' }}>{rx.pharmacy_name || '-'}</td>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>
                  {rx.status}
                </td>
                <td style={{ padding: '10px' }}>
                  {getPatientStatusLabel(rx.status)}
                </td>
                <td style={{ padding: '10px' }}>
                  {rx.updated_at ? new Date(rx.updated_at).toLocaleString() : '-'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
