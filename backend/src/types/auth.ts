export type RoleType = 'admin' | 'doctor' | 'pharmacy' | 'patient';

export interface AuthUserContext {
  userId: string;
  role: RoleType;
  doctorProfileId?: string;
  pharmacyProfileId?: string;
  patientProfileId?: string;
}

export interface JwtPayload {
  sub: string;
  role: RoleType;
}
