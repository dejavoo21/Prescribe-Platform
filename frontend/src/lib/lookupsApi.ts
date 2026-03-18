import { apiFetch } from './api';

export interface LookupOption {
  id: string;
  label: string;
}

type ApiResponse<T> = {
  data: T;
};

export async function getPatientOptions() {
  return apiFetch<ApiResponse<LookupOption[]>>('/lookups/patients');
}

export async function getPharmacyOptions() {
  return apiFetch<ApiResponse<LookupOption[]>>('/lookups/pharmacies');
}

export async function getMedicationOptions(search?: string) {
  const query = search?.trim()
    ? `/lookups/medications?search=${encodeURIComponent(search.trim())}`
    : '/lookups/medications';

  return apiFetch<ApiResponse<LookupOption[]>>(query);
}
