import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  cancelPrescription,
  createPrescription,
  discardPrescription,
  getDoctorPrescriptions,
  revertPrescriptionToDraft,
  sendPrescription,
  signPrescription,
} from '../../lib/prescriptionsApi';
import {
  getMedicationOptions,
  getPatientOptions,
  getPharmacyOptions,
  LookupOption,
} from '../../lib/lookupsApi';
import { CancelFormModal } from '../../components/CancelFormModal';
import {
  CreatePrescriptionInput,
  Prescription,
} from '../../types/prescriptions';
import { joinName } from '../../lib/display';

const initialForm: CreatePrescriptionInput = {
  patientId: '',
  pharmacyId: '',
  medicationId: '',
  dosage: '',
  frequency: '',
  duration: '',
  quantityPrescribed: 1,
  specialInstructions: '',
};

export function DoctorPrescriptionsPage() {
  const [items, setItems] = useState<Prescription[]>([]);
  const [patientOptions, setPatientOptions] = useState<LookupOption[]>([]);
  const [pharmacyOptions, setPharmacyOptions] = useState<LookupOption[]>([]);
  const [medicationOptions, setMedicationOptions] = useState<LookupOption[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CreatePrescriptionInput>(initialForm);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null);

  async function loadPrescriptions() {
    const response = await getDoctorPrescriptions();
    setItems(response.data);
  }

  async function loadLookups() {
    const [patients, pharmacies, medications] = await Promise.all([
      getPatientOptions(),
      getPharmacyOptions(),
      getMedicationOptions(),
    ]);

    setPatientOptions(patients.data);
    setPharmacyOptions(pharmacies.data);
    setMedicationOptions(medications.data);
  }

  async function loadAll() {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([loadPrescriptions(), loadLookups()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load page');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await createPrescription({
        ...form,
        quantityPrescribed: form.quantityPrescribed || null,
        specialInstructions: form.specialInstructions || null,
        pharmacyId: form.pharmacyId || undefined,
      });

      setForm(initialForm);
      await loadPrescriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create prescription');
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSign(id: string) {
    setError(null);
    try {
      await signPrescription(id);
      await loadPrescriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign prescription');
    }
  }

  async function handleRevert(id: string) {
    setError(null);
    try {
      await revertPrescriptionToDraft(id);
      await loadPrescriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revert prescription');
    }
  }

  async function handleSend(id: string, pharmacyId?: string | null) {
    setError(null);
    try {
      await sendPrescription(id, pharmacyId || undefined);
      await loadPrescriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send prescription');
    }
  }

  async function handleCancel(id: string) {
    setError(null);
    try {
      await discardPrescription(id);
      await loadPrescriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to discard prescription');
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
      await loadPrescriptions();
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

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1>Doctor Prescriptions</h1>
        <Link to="/doctor">Back to Dashboard</Link>
      </div>

      <section style={{ marginBottom: 32, padding: 16, border: '1px solid #ddd' }}>
        <h2>Create Draft Prescription</h2>

        <form
          onSubmit={handleCreate}
          style={{ display: 'grid', gap: 12, maxWidth: 600 }}
        >
          <label>
            Patient
            <select
              value={form.patientId}
              onChange={(e) => setForm({ ...form, patientId: e.target.value })}
              required
              style={{ width: '100%', marginTop: 4, padding: 8 }}
            >
              <option value="">Select patient</option>
              {patientOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Pharmacy
            <select
              value={form.pharmacyId || ''}
              onChange={(e) => setForm({ ...form, pharmacyId: e.target.value })}
              style={{ width: '100%', marginTop: 4, padding: 8 }}
            >
              <option value="">Select pharmacy</option>
              {pharmacyOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Medication
            <select
              value={form.medicationId}
              onChange={(e) => setForm({ ...form, medicationId: e.target.value })}
              required
              style={{ width: '100%', marginTop: 4, padding: 8 }}
            >
              <option value="">Select medication</option>
              {medicationOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <input
            placeholder="Dosage"
            value={form.dosage}
            onChange={(e) => setForm({ ...form, dosage: e.target.value })}
            required
          />

          <input
            placeholder="Frequency"
            value={form.frequency}
            onChange={(e) => setForm({ ...form, frequency: e.target.value })}
            required
          />

          <input
            placeholder="Duration"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
            required
          />

          <input
            type="number"
            placeholder="Quantity Prescribed"
            value={form.quantityPrescribed ?? ''}
            onChange={(e) =>
              setForm({
                ...form,
                quantityPrescribed: e.target.value ? Number(e.target.value) : null,
              })
            }
          />

          <textarea
            placeholder="Special Instructions"
            value={form.specialInstructions || ''}
            onChange={(e) =>
              setForm({ ...form, specialInstructions: e.target.value })
            }
          />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Draft'}
          </button>
        </form>
      </section>

      {error ? (
        <div style={{ color: 'crimson', marginBottom: 16 }}>{error}</div>
      ) : null}

      <section>
        <h2>My Prescriptions</h2>

        {isLoading ? (
          <div>Loading prescriptions...</div>
        ) : items.length === 0 ? (
          <div>No prescriptions found.</div>
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
                <th style={cellStyle}>Pharmacy</th>
                <th style={cellStyle}>Status</th>
                <th style={cellStyle}>Created</th>
                <th style={cellStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={cellStyle}>{item.id}</td>
                  <td style={cellStyle}>
                    {joinName(item.patient_first_name, item.patient_last_name)}
                  </td>
                  <td style={cellStyle}>
                    {item.medication_name}
                    {item.medication_strength ? ` - ${item.medication_strength}` : ''}
                  </td>
                  <td style={cellStyle}>{item.pharmacy_name || '-'}</td>
                  <td style={cellStyle}>{item.status}</td>
                  <td style={cellStyle}>
                    {item.created_at ? new Date(item.created_at).toLocaleString() : '-'}
                  </td>
                  <td style={cellStyle}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {item.status === 'DRAFTED' ? (
                        <>
                          <button onClick={() => handleSign(item.id)}>Sign</button>
                          <button onClick={() => handleDiscard(item.id)}>Discard</button>
                        </>
                      ) : null}

                      {item.status === 'SIGNED' ? (
                        <>
                          <button onClick={() => handleRevert(item.id)}>
                            Revert
                          </button>
                          <button
                            onClick={() => handleSend(item.id, item.pharmacy_id)}
                          >
                            Send
                          </button>
                          <button onClick={() => handleCancelClick(item.id)}>Cancel</button>
                        </>
                      ) : null}

                      {item.status === 'SENT' || item.status === 'RECEIVED' ? (
                        <button onClick={() => handleCancelClick(item.id)}>Cancel</button>
                      ) : null}

                      {item.status === 'DISCARDED' ? <span>Discarded</span> : null}
                      {item.status === 'CANCELLED' ? <span>Cancelled</span> : null}
                      {item.status === 'EXPIRED' ? <span>Expired</span> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

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
