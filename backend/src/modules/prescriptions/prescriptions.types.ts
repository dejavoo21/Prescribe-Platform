export type PrescriptionStatus =
  | 'DRAFTED'
  | 'SIGNED'
  | 'SENT'
  | 'RECEIVED'
  | 'DISPENSED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'DISCARDED';

export type CreatePrescriptionInput = {
  patientId: string;
  pharmacyId?: string;
  medicationId: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantityPrescribed?: number | null;
  specialInstructions?: string | null;
};

export type SendPrescriptionInput = {
  pharmacyId?: string;
};
