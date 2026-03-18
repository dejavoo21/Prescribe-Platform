export type RoleType = 'admin' | 'doctor' | 'pharmacy' | 'patient';

export interface AuthUser {
  userId: string;
  role: RoleType;
  doctorProfileId?: string;
  pharmacyProfileId?: string;
  patientProfileId?: string;
}

export interface LoginResponseUser {
  id: string;
  email: string;
  role: RoleType;
  doctorProfileId?: string;
  pharmacyProfileId?: string;
  patientProfileId?: string;
}
