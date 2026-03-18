export type PrescriptionStatus =
  | 'DRAFTED'
  | 'SIGNED'
  | 'SENT'
  | 'RECEIVED'
  | 'DISPENSED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'DISCARDED';

export interface Prescription {
  id: string;
  patient_id: string;
  pharmacy_id: string | null;
  medication_id: string;
  doctor_id?: string;

  status: PrescriptionStatus;
  dosage?: string;
  frequency?: string;
  duration?: string;
  quantity_prescribed?: number | null;
  quantity_dispensed?: number | null;
  special_instructions?: string | null;

  created_at?: string;
  signed_at?: string | null;
  sent_at?: string | null;
  received_at?: string | null;
  dispensed_at?: string | null;
  updated_at?: string;

  patient_first_name?: string;
  patient_last_name?: string;

  doctor_first_name?: string;
  doctor_last_name?: string;

  pharmacy_name?: string | null;

  medication_name?: string;
  medication_strength?: string | null;
}

export interface CreatePrescriptionInput {
  patientId: string;
  pharmacyId?: string;
  medicationId: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantityPrescribed?: number | null;
  specialInstructions?: string | null;
}
