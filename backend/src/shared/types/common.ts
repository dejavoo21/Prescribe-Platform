export type RoleType = 'admin' | 'doctor' | 'pharmacy' | 'patient';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: RoleType;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Doctor {
  id: string;
  userId: string;
  licenseNumber: string;
  specialties: string[];
  clinic: string;
  licenseVerifiedAt?: Date;
}

export interface Pharmacy {
  id: string;
  userId: string;
  licenseNumber: string;
  registrationNumber: string;
  address: string;
  phone: string;
  licenseVerifiedAt?: Date;
}

export interface Patient {
  id: string;
  userId: string;
  dateOfBirth: Date;
  medicalRecordNumber?: string;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface Medication {
  id: string;
  name: string;
  genericName: string;
  dosageForm: string;
  strength: string;
  manufacturerId: string;
  ndc?: string; // National Drug Code
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
