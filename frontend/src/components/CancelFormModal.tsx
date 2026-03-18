import { useState } from 'react';

interface CancelFormModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  onSubmit: (reasonCode: string, note: string) => void;
  onCancel: () => void;
}

export function CancelFormModal({
  isOpen,
  isLoading = false,
  onSubmit,
  onCancel,
}: CancelFormModalProps) {
  const [reasonCode, setReasonCode] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reasonCode.trim()) {
      setError('Cancellation reason code is required');
      return;
    }

    onSubmit(reasonCode.trim(), note.trim());
    setReasonCode('');
    setNote('');
  };

  const handleClose = () => {
    setReasonCode('');
    setNote('');
    setError(null);
    onCancel();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
          maxWidth: '400px',
          width: '90%',
          zIndex: 1001,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px' }}>
          Cancel Prescription
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 500,
                fontSize: '14px',
              }}
            >
              Cancellation Reason Code *
            </label>
            <input
              type="text"
              placeholder="e.g., out_of_stock, pharmacy_rejected, patient_request, data_error"
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />
            <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
              Code explaining why this prescription is being cancelled
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 500,
                fontSize: '14px',
              }}
            >
              Additional Notes (Optional)
            </label>
            <textarea
              placeholder="Add any additional context for this cancellation"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={isLoading}
              rows={3}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                padding: '12px',
                marginBottom: '16px',
                backgroundColor: '#fee',
                color: '#c33',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f0f0f0',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                padding: '8px 16px',
                backgroundColor: isLoading ? '#ccc' : '#d9534f',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 500,
              }}
            >
              {isLoading ? 'Cancelling...' : 'Cancel Prescription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
