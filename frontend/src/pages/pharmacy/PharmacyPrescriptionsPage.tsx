import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  cancelPrescription,
  dispensePrescription,
  getAssignedPrescriptions,
  receivePrescription,
} from '../../lib/prescriptionsApi';
import { Prescription } from '../../types/prescriptions';
import { joinName } from '../../lib/display';
import { CancelFormModal } from '../../components/CancelFormModal';

type DispenseFormState = Record<
  string,
  {
    quantityDispensed?: number | null;
    lotNumber?: string | null;
    expirationDate?: string | null;
  }
>;

export function PharmacyPrescriptionsPage() {
  const [items, setItems] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dispenseForms, setDispenseForms] = useState<DispenseFormState>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getAssignedPrescriptions();
      setItems(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load prescriptions');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleReceive(id: string) {
    setError(null);
    try {
      await receivePrescription(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to receive prescription');
    }
  }

  async function handleDispense(id: string) {
    setError(null);
    try {
      const form = dispenseForms[id] || {};
      await dispensePrescription(id, {
        quantityDispensed: form.quantityDispensed ?? null,
        lotNumber: form.lotNumber || null,
        expirationDate: form.expirationDate || null,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dispense prescription');
    }
  }

  async function handleCancel(id: string) {
    setError(null);
    try {
      await dispensePrescription(id, {
        quantityDispensed: null,
        lotNumber: null,
        expirationDate: null,
      });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dispense prescription');
    }
  }

  function handleCancelClick(id: string) {
    setPendingCancelId(id);
    setCancelModalOpen(true);
  }

  async function handleCancelSubmit(reasonCode: string, note: string) {
    setError(null);
    if (!pendingCancelId) return;

    setIsSubmitting(true);
    try {
      await cancelPrescription(pendingCancelId, {
        cancellationReasonCode: reasonCode,
        cancellationNote: note || null,
      });
      setCancelModalOpen(false);
      setPendingCancelId(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel prescription');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleCancelClose() {
    setCancelModalOpen(false);
    setPendingCancelId(null);
  }

  function updateDispenseForm(
    id: string,
    patch: {
      quantityDispensed?: number | null;
      lotNumber?: string | null;
      expirationDate?: string | null;
    }
  ) {
    setDispenseForms((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        ...patch,
      },
    }));
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1>Assigned Prescriptions</h1>
        <Link to="/pharmacy">Back to Dashboard</Link>
      </div>

      {error ? <div style={{ color: 'crimson', marginBottom: 16 }}>{error}</div> : null}

      {isLoading ? (
        <div>Loading assigned prescriptions...</div>
      ) : items.length === 0 ? (
        <div>No assigned prescriptions found.</div>
      ) : (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            border: '1px solid #ddd',
          }}
        >
          <thead>
            <tr>
              <th style={cellStyle}>ID</th>
              <th style={cellStyle}>Patient</th>
              <th style={cellStyle}>Medication</th>
              <th style={cellStyle}>Doctor</th>
              <th style={cellStyle}>Status</th>
              <th style={cellStyle}>Sent</th>
              <th style={cellStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const form = dispenseForms[item.id] || {};

              return (
                <tr key={item.id}>
                  <td style={cellStyle}>{item.id}</td>
                  <td style={cellStyle}>
                    {joinName(item.patient_first_name, item.patient_last_name)}
                  </td>
                  <td style={cellStyle}>
                    {item.medication_name}
                    {item.medication_strength ? ` - ${item.medication_strength}` : ''}
                  </td>
                  <td style={cellStyle}>
                    {joinName(item.doctor_first_name, item.doctor_last_name)}
                  </td>
                  <td style={cellStyle}>{item.status}</td>
                  <td style={cellStyle}>
                    {item.sent_at ? new Date(item.sent_at).toLocaleString() : '-'}
                  </td>
                  <td style={cellStyle}>
                    {item.status === 'SENT' ? (
                      <>
                        <button onClick={() => handleReceive(item.id)}>Receive</button>
                        <button onClick={() => handleCancelClick(item.id)}>Cancel</button>
                      </>
                    ) : null}

                    {item.status === 'RECEIVED' ? (
                      <div style={{ display: 'grid', gap: 8, minWidth: 220 }}>
                        <input
                          type="number"
                          placeholder="Quantity dispensed"
                          value={form.quantityDispensed ?? ''}
                          onChange={(e) =>
                            updateDispenseForm(item.id, {
                              quantityDispensed: e.target.value
                                ? Number(e.target.value)
                                : null,
                            })
                          }
                        />

                        <input
                          placeholder="Lot number"
                          value={form.lotNumber ?? ''}
                          onChange={(e) =>
                            updateDispenseForm(item.id, {
                              lotNumber: e.target.value,
                            })
                          }
                        />

                        <input
                          type="date"
                          value={form.expirationDate ?? ''}
                          onChange={(e) =>
                            updateDispenseForm(item.id, {
                              expirationDate: e.target.value,
                            })
                          }
                        />

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleDispense(item.id)}>
                            Dispense
                          </button>
                          <button onClick={() => handleCancelClick(item.id)}>Cancel</button>
                        </div>
                      </div>
                    ) : null}

                    {item.status === 'DISPENSED' ? <span>Dispensed</span> : null}
                    {item.status === 'CANCELLED' ? <span>Cancelled</span> : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <CancelFormModal
        isOpen={cancelModalOpen}
        isLoading={isSubmitting}
        onSubmit={handleCancelSubmit}
        onCancel={handleCancelClose}
      />
    </div>
  );
}

const cellStyle: React.CSSProperties = {
  border: '1px solid #ddd',
  padding: 8,
  verticalAlign: 'top',
};
