BEGIN;

-- =========================================
-- EXTENSIONS
-- =========================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================
-- UPDATED_AT TRIGGER
-- =========================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =========================================
-- USERS
-- =========================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'doctor', 'pharmacy', 'patient')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================
-- DOCTORS
-- =========================================
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  license_number TEXT NOT NULL UNIQUE,
  specialty TEXT,
  clinic_name TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_doctors_updated_at
BEFORE UPDATE ON doctors
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================
-- PHARMACIES
-- =========================================
CREATE TABLE pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  license_number TEXT NOT NULL UNIQUE,
  phone TEXT,
  email TEXT,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_pharmacies_updated_at
BEFORE UPDATE ON pharmacies
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================
-- PATIENTS
-- =========================================
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE RESTRICT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  phone TEXT,
  allergies JSONB NOT NULL DEFAULT '[]'::jsonb,
  chronic_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  medication_history JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferred_pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_patients_updated_at
BEFORE UPDATE ON patients
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================
-- MEDICATIONS
-- =========================================
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  generic_name TEXT,
  strength TEXT,
  form TEXT,
  din TEXT,
  manufacturer TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medications_name ON medications(name);

CREATE TRIGGER trg_medications_updated_at
BEFORE UPDATE ON medications
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================
-- PRESCRIPTIONS
-- =========================================
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE RESTRICT,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
  pharmacy_id UUID REFERENCES pharmacies(id) ON DELETE SET NULL,
  medication_id UUID NOT NULL REFERENCES medications(id) ON DELETE RESTRICT,

  status TEXT NOT NULL CHECK (
    status IN (
      'DRAFTED',
      'SIGNED',
      'SENT',
      'RECEIVED',
      'DISPENSED',
      'CANCELLED',
      'EXPIRED',
      'DISCARDED'
    )
  ),

  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT NOT NULL,
  quantity_prescribed NUMERIC(10,2),
  special_instructions TEXT,

  -- lifecycle timestamps
  signed_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  dispensed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  discarded_at TIMESTAMPTZ,

  -- cancellation fields
  cancelled_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  cancelled_by_role TEXT CHECK (cancelled_by_role IN ('doctor', 'pharmacy', 'system')),
  cancellation_reason_code TEXT,
  cancellation_note TEXT,

  -- dispense fields
  quantity_dispensed NUMERIC(10,2),
  lot_number TEXT,
  medication_expiration_date DATE,

  -- concurrency / control
  version INTEGER NOT NULL DEFAULT 1,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_pharmacy_id ON prescriptions(pharmacy_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_prescriptions_created_at ON prescriptions(created_at);

CREATE TRIGGER trg_prescriptions_updated_at
BEFORE UPDATE ON prescriptions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- =========================================
-- AUDIT LOGS
-- =========================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_value JSONB,
  new_value JSONB,
  status TEXT NOT NULL CHECK (status IN ('success', 'denied', 'failed')),
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource_type_resource_id ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =========================================
-- NOTIFICATIONS
-- =========================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_resource_type TEXT,
  related_resource_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

COMMIT;
