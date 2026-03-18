import { apiFetch } from './api';
import { CreatePrescriptionInput, Prescription } from '../types/prescriptions';

type ApiResponse<T> = {
  data: T;
};

export async function getDoctorPrescriptions() {
  return apiFetch<ApiResponse<Prescription[]>>('/prescriptions/mine');
}

export async function createPrescription(input: CreatePrescriptionInput) {
  return apiFetch<ApiResponse<Prescription>>('/prescriptions', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function signPrescription(id: string) {
  return apiFetch<ApiResponse<Prescription>>(`/prescriptions/${id}/sign`, {
    method: 'PUT',
  });
}

export async function revertPrescriptionToDraft(id: string) {
  return apiFetch<ApiResponse<Prescription>>(
    `/prescriptions/${id}/revert-to-draft`,
    {
      method: 'PUT',
    }
  );
}

export async function sendPrescription(id: string, pharmacyId?: string) {
  return apiFetch<ApiResponse<Prescription>>(`/prescriptions/${id}/send`, {
    method: 'PUT',
    body: JSON.stringify(pharmacyId ? { pharmacyId } : {}),
  });
}

export async function getAssignedPrescriptions() {
  return apiFetch<ApiResponse<Prescription[]>>('/prescriptions/assigned');
}

export async function receivePrescription(id: string) {
  return apiFetch<ApiResponse<Prescription>>(`/prescriptions/${id}/receive`, {
    method: 'PUT',
  });
}

export async function dispensePrescription(
  id: string,
  input: {
    quantityDispensed?: number | null;
    lotNumber?: string | null;
    expirationDate?: string | null;
  }
) {
  return apiFetch<ApiResponse<Prescription>>(`/prescriptions/${id}/dispense`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function getVisiblePatientPrescriptions() {
  return apiFetch<ApiResponse<Prescription[]>>('/prescriptions/visible');
}

export async function discardPrescription(id: string) {
  return apiFetch<ApiResponse<Prescription>>(`/prescriptions/${id}/discard`, {
    method: 'PUT',
  });
}

export async function cancelPrescription(
  id: string,
  input: {
    cancellationReasonCode: string;
    cancellationNote?: string | null;
  }
) {
  return apiFetch<ApiResponse<Prescription>>(`/prescriptions/${id}/cancel`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}
