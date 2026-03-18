export type UserRole = 'admin' | 'doctor' | 'pharmacy' | 'patient';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
}

export interface Doctor extends User {
  licenseNumber: string;
  specialties: string[];
  clinic: string;
}

export interface Pharmacy extends User {
  licenseNumber: string;
  registrationNumber: string;
  address: string;
  phone: string;
}

export interface Patient extends User {
  dateOfBirth: Date;
  allergies: string[];
  emergencyContact?: string;
}

export interface Prescription {
  id: string;
  doctorId: string;
  patientId: string;
  medicationId: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  status: 'created' | 'submitted' | 'received' | 'dispensed' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface Medication {
  id: string;
  name: string;
  genericName: string;
  dosageForm: string;
  strength: string;
  ndc?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
