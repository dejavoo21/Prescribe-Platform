# PHASE1_DEVELOPER_TASKS

**Project**: Prescribe Platform  
**Phase**: Phase 1 MVP  
**Purpose**: Specific, actionable tasks by role  
**Status**: Implementation baseline

---

## Backend Developer Tasks

### Database & Schema Tasks

**Task: Create Migration File**
- File: `backend/src/db/migrations/001_initial_schema.sql`
- Create `users` table:
  - `id` (UUID primary key)
  - `email` (varchar, unique)
  - `password_hash` (varchar, never null)
  - `role` (enum: admin, doctor, pharmacy, patient)
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

- Create `doctors` table:
  - `id` (UUID primary key)
  - `user_id` (UUID foreign key → users.id)
  - `license_number` (varchar, unique)
  - `specialization` (varchar)
  - `created_at` (timestamp)

- Create `pharmacies` table:
  - `id` (UUID primary key)
  - `user_id` (UUID foreign key → users.id)
  - `pharmacy_name` (varchar)
  - `license_number` (varchar, unique)
  - `created_at` (timestamp)

- Create `patients` table:
  - `id` (UUID primary key)
  - `user_id` (UUID foreign key → users.id)
  - `first_name` (varchar)
  - `last_name` (varchar)
  - `date_of_birth` (date)
  - `allergies` (text, nullable)
  - `chronic_conditions` (text, nullable)
  - `created_at` (timestamp)

- Create `medications` table:
  - `id` (UUID primary key)
  - `name` (varchar)
  - `dosage_form` (varchar)
  - `created_at` (timestamp)

- Create `prescriptions` table:
  - `id` (UUID primary key)
  - `doctor_id` (UUID foreign key → doctors.id)
  - `patient_id` (UUID foreign key → patients.id)
  - `pharmacy_id` (UUID foreign key → pharmacies.id, nullable)
  - `medication_id` (UUID foreign key → medications.id)
  - `dosage` (varchar)
  - `frequency` (varchar)
  - `duration` (varchar)
  - `status` (enum: DRAFTED, SIGNED, SENT, RECEIVED, DISPENSED, CANCELLED, EXPIRED, DISCARDED)
  - `created_at` (timestamp)
  - `signed_at` (timestamp, nullable)
  - `sent_at` (timestamp, nullable)
  - `received_at` (timestamp, nullable)
  - `dispensed_at` (timestamp, nullable)
  - `cancelled_at` (timestamp, nullable)
  - `expired_at` (timestamp, nullable)
  - `updated_at` (timestamp)

- Create `audit_logs` table:
  - `id` (UUID primary key)
  - `user_id` (UUID foreign key → users.id)
  - `action` (varchar)
  - `resource_type` (varchar)
  - `resource_id` (UUID)
  - `old_value` (jsonb, nullable)
  - `new_value` (jsonb, nullable)
  - `status` (varchar: success, denied)
  - `ip_address` (inet, nullable)
  - `created_at` (timestamp)

- Create `notifications` table:
  - `id` (UUID primary key)
  - `user_id` (UUID foreign key → users.id)
  - `prescription_id` (UUID foreign key → prescriptions.id, nullable)
  - `notification_type` (varchar)
  - `read_at` (timestamp, nullable)
  - `created_at` (timestamp)

- Add indexes:
  - `idx_users_email` on users(email)
  - `idx_doctors_license` on doctors(license_number)
  - `idx_pharmacies_license` on pharmacies(license_number)
  - `idx_prescriptions_doctor_status` on prescriptions(doctor_id, status)
  - `idx_prescriptions_pharmacy_status` on prescriptions(pharmacy_id, status)
  - `idx_prescriptions_patient_status` on prescriptions(patient_id, status)
  - `idx_audit_logs_user_created` on audit_logs(user_id, created_at)
  - `idx_audit_logs_resource` on audit_logs(resource_type, resource_id)

- Add constraints:
  - CHECK on prescriptions.status to enforce only Phase 1 valid statuses
  - NOT NULL on all required fields
  - UNIQUE constraints on email, license numbers

**Success**: Migration runs without errors on fresh DB.

---

**Task: Create Seed Script**
- File: `backend/src/db/seed.sql` or `seed.ts`
- Create 1 admin user:
  - email: `admin@prescribe.local`
  - password hash: bcrypt of `Demo1234!`
  - role: admin

- Create 2 doctor users with profiles:
  - `doctor1@prescribe.local`, license: `MD001`, specialization: Internal Medicine
  - `doctor2@prescribe.local`, license: `MD002`, specialization: Cardiology

- Create 2 pharmacy users with profiles:
  - `pharmacy1@prescribe.local`, license: `PH001`, pharmacy_name: Central Pharmacy
  - `pharmacy2@prescribe.local`, license: `PH002`, pharmacy_name: Downtown Pharmacy

- Create 5 patient users with profiles:
  - patient1..patient5@prescribe.local
  - Seed with sample names, DOBs, allergies, chronic conditions

- Create 10 sample medications:
  - amoxicillin, ibuprofen, metformin, lisinopril, aspirin, acetaminophen, sertraline, omeprazole, levothyroxine, atorvastatin

- Create at least 1 sample draft prescription:
  - doctor: doctor1
  - patient: patient1
  - medication: amoxicillin
  - dosage: 500mg
  - frequency: twice daily
  - duration: 7 days
  - status: DRAFTED

**Success**: Seed runs cleanly, test users exist, sample data loads.

---

### Authentication Tasks

**Task: Implement Login Endpoint**
- File: `backend/src/controllers/auth.controller.ts`
- Create POST `/api/auth/login`
  - Input: `{ email, password }`
  - Validate email exists in database
  - Hash input password, compare to password_hash in DB
  - If match: generate JWT with `{ userId, email, role }`
  - Return: `{ user: { id, email, role }, token }`
  - If no match: return 401 with generic error message
  - Never return password hash or confirm/deny email existence

- Install and configure bcryptjs, jsonwebtoken

- Store JWT secret in environment variable

**Success**: Seed user can log in, invalid credentials fail safely.

---

**Task: Implement Auth Middleware**
- File: `backend/src/middleware/auth.ts`
- Create `authenticate()` middleware:
  - Extract JWT from Authorization header or httpOnly cookie
  - Validate JWT signature and expiration
  - Decode to get userId
  - Load user record from database
  - Load role from users.role
  - Load profile IDs:
    - If role = doctor, load doctors.id → attach as `req.user.doctorProfileId`
    - If role = pharmacy, load pharmacies.id → attach as `req.user.pharmacyProfileId`
    - If role = patient, load patients.id → attach as `req.user.patientProfileId`
    - Others: set to null
  - Attach to `req.user` object
  - Call next()
  - If JWT invalid/expired: return 401

- Create `authorizeRoles(...roles)` middleware:
  - Check if `req.user.role` is in allowed roles
  - If not: return 403
  - If yes: call next()

**Success**: Authenticated request has req.user with role and all profile IDs. Unauthenticated requests are rejected.

---

### Authorization Tasks

**Task: Implement Resource Ownership Checks**
- File: `backend/src/middleware/authorization.ts`

Create these middleware functions:

- `validateDoctorOwnership`:
  - Load prescription from DB using req.params.id
  - Compare prescription.doctor_id to req.user.doctorProfileId
  - If not equal: return 403 with "Not your prescription"
  - If equal: call next()

- `validatePharmacyAssignment`:
  - Load prescription from DB using req.params.id
  - Compare prescription.pharmacy_id to req.user.pharmacyProfileId
  - If not equal: return 403 with "Prescription not assigned to your pharmacy"
  - If equal: call next()

- `validatePatientOwnership`:
  - Load prescription from DB using req.params.id
  - Compare prescription.patient_id to req.user.patientProfileId
  - If not equal: return 403 with "Not your prescription"
  - Check prescription.status is in visible list (SENT, RECEIVED, DISPENSED, CANCELLED, EXPIRED)
  - If not visible: return 403 with "Prescription not visible"
  - If all checks pass: call next()

- `blockAdminPrescriptionAccess`:
  - Check if req.user.role = admin
  - Check if req.path includes /prescriptions
  - If both true: return 403 with "Admin has no default access to prescription content in Phase 1"
  - Otherwise: call next()

**Success**: Doctor cannot access other doctor's prescriptions, pharmacy cannot access unassigned, patient cannot access hidden statuses.

---

### Prescription API Tasks

**Task: Implement Doctor Prescription Endpoints**
- File: `backend/src/controllers/prescription.controller.ts`

Implement these endpoints:

- `POST /api/prescriptions` (doctor only)
  - Middleware: authenticate, authorizeRoles('doctor')
  - Input: `{ patientId, medicationId, dosage, frequency, duration }`
  - Validate: patient exists, medication exists, required fields present
  - Create prescription with:
    - doctor_id = req.user.doctorProfileId
    - patient_id = input patientId
    - status = 'DRAFTED'
    - created_at = now
  - Return 201 with prescription object
  - Audit: log "create_draft"

- `PUT /api/prescriptions/:id/sign` (doctor owner only)
  - Middleware: authenticate, authorizeRoles('doctor'), validateDoctorOwnership
  - Input: none
  - Load prescription
  - Validate: status = 'DRAFTED'
  - Update: status = 'SIGNED', signed_at = now, updated_at = now
  - Use WHERE clause to check current status
  - Return 200 with prescription object
  - Audit: log "prescription_signed"

- `PUT /api/prescriptions/:id/revert-to-draft` (doctor owner only)
  - Middleware: authenticate, authorizeRoles('doctor'), validateDoctorOwnership
  - Input: none
  - Load prescription
  - Validate: status = 'SIGNED'
  - Update: status = 'DRAFTED', updated_at = now
  - Return 200 with prescription object
  - Audit: log "prescription_reverted"

- `PUT /api/prescriptions/:id/send` (doctor owner only)
  - Middleware: authenticate, authorizeRoles('doctor'), validateDoctorOwnership
  - Input: `{ pharmacyId }`
  - Load prescription
  - Validate: status = 'SIGNED', pharmacyId exists and is active
  - Update: status = 'SENT', sent_at = now, pharmacy_id = pharmacyId, updated_at = now
  - Create notification for pharmacy
  - Create notification for patient
  - Return 200 with prescription object
  - Audit: log "prescription_sent"

**Success**: Doctor can create, sign, revert, send. Invalid transitions fail. All logged.

---

**Task: Implement Pharmacy Prescription Endpoints**
- File: `backend/src/controllers/prescription.controller.ts`

Implement these endpoints:

- `PUT /api/prescriptions/:id/receive` (pharmacy assigned only)
  - Middleware: authenticate, authorizeRoles('pharmacy'), validatePharmacyAssignment
  - Input: none
  - Load prescription
  - Validate: status = 'SENT'
  - Update: status = 'RECEIVED', received_at = now, updated_at = now
  - Create notification for doctor
  - Create notification for patient
  - Return 200 with prescription object
  - Audit: log "prescription_received"

- `PUT /api/prescriptions/:id/dispense` (pharmacy assigned only)
  - Middleware: authenticate, authorizeRoles('pharmacy'), validatePharmacyAssignment
  - Input: none
  - Load prescription
  - Validate: status = 'RECEIVED'
  - Update: status = 'DISPENSED', dispensed_at = now, updated_at = now
  - Create notification for patient
  - Return 200 with prescription object
  - Audit: log "prescription_dispensed"

**Success**: Pharmacy can receive and dispense. Unassigned prescriptions rejected. All logged.

---

**Task: Implement Query Endpoints for Each Role**
- File: `backend/src/controllers/prescription.controller.ts`

Implement:

- `GET /api/prescriptions` for each role
  - Doctor: `SELECT (explicit fields) FROM prescriptions WHERE doctor_id = $1`
  - Pharmacy: `SELECT (explicit fields) FROM prescriptions WHERE pharmacy_id = $1 AND status IN ('SENT', 'RECEIVED', 'DISPENSED')`
  - Patient: `SELECT (explicit fields) FROM prescriptions WHERE patient_id = $1 AND status IN ('SENT', 'RECEIVED', 'DISPENSED', 'CANCELLED', 'EXPIRED')`
  - Return list of prescriptions

- `GET /api/prescriptions/:id`
  - Load prescription by ID
  - Check authorization using appropriate middleware
  - Return single prescription object

**Success**: Each role sees only their own prescriptions, patient sees only visible statuses.

---

### Audit Logging Tasks

**Task: Wire Audit Logging Service**
- File: `backend/src/services/audit.service.ts`

Create `auditLog()` function:
- Input: userId, action, resourceType, resourceId, oldValue, newValue, status (success/denied), ipAddress
- Insert into audit_logs:
  - user_id = userId
  - action = action
  - resource_type = resourceType
  - resource_id = resourceId
  - old_value = oldValue (as JSON)
  - new_value = newValue (as JSON)
  - status = status
  - ip_address = ipAddress
  - created_at = now
- Never throw on audit failure (fail silently if audit insert fails, but log error)

Call auditLog() from:
- create draft
- sign
- revert
- send
- receive
- dispense
- cancel
- discard
- denied access attempts (where enforced)

**Success**: Every mutation has audit entry. Audit table never grows faster than mutations.

---

### Integration Tasks

**Task: Wire All Endpoints Together**
- Create Express router
- Attach auth middleware to all protected routes
- Attach authorization middleware to all resource routes
- Test complete flow:
  - Doctor logs in
  - Doctor creates prescription
  - Doctor signs
  - Doctor sends
  - (Switch user to pharmacy)
  - Pharmacy receives
  - Pharmacy dispenses
- Verify audit log has 5 entries

**Success**: Full happy path works via Postman/curl.

---

## Frontend Developer Tasks

### Auth Tasks

**Task: Implement Login Page**
- File: `frontend/src/pages/Login.tsx`
- Create form with:
  - Email input field
  - Password input field
  - Login button
  - Error message display area
- On submit:
  - POST to `/api/auth/login` with email and password
  - If 200: store token, redirect to /dashboard
  - If 401: show error message "Invalid email or password"
  - If 500: show error message "Server error, please try again"

**Success**: Seed user can log in from UI.

---

**Task: Implement Auth Context/Hook**
- File: `frontend/src/hooks/useAuth.ts` or `frontend/src/context/AuthContext.tsx`
- Implement `useAuth()` hook returning:
  - `user` object with id, email, role
  - `token` string
  - `login(email, password)` function
  - `logout()` function
- On app load:
  - Check for token in localStorage or sessionStorage
  - If token exists, call GET `/api/auth/me` to validate and load user
  - If 200, set user and token
  - If 401, clear token and redirect to login
- On login: set token and user
- On logout: clear token and user, redirect to login

**Success**: Token persists across page reloads. Invalid token clears on app load.

---

**Task: Implement API Interceptor**
- File: `frontend/src/services/api.ts`
- Create axios/fetch wrapper
- Attach Authorization header to all requests: `Authorization: Bearer ${token}`
- On 401 response: call logout, redirect to login
- On 403 response: show error "Access denied"
- On other errors: show generic error message

**Success**: All API requests include token. 401s trigger logout.

---

### Route Protection Tasks

**Task: Implement Protected Routes**
- File: `frontend/src/components/ProtectedRoute.tsx`
- Create component that:
  - Checks if user is authenticated
  - If not authenticated: redirect to /login
  - If authenticated and role matches: render page
  - If authenticated but role doesn't match: show 403 error

- Define routes:
  - `/login` - public
  - `/doctor` - requires doctor role
  - `/pharmacy` - requires pharmacy role
  - `/patient` - requires patient role
  - `/admin` - requires admin role

**Success**: Unauthenticated users cannot access dashboards. Wrong-role users get 403.

---

### Doctor Dashboard Tasks

**Task: Implement Doctor Dashboard**
- File: `frontend/src/pages/DoctorDashboard.tsx`
- Load doctor's prescriptions:
  - GET `/api/prescriptions`
  - Sort by created_at descending
  - Display in table with columns: ID, Patient, Medication, Status, Created
- Add "Create Prescription" button
- Each prescription is clickable → detail view
- Show status badge (color-coded)

**Success**: Doctor sees own prescriptions, can click to detail.

---

**Task: Implement Prescription Form**
- File: `frontend/src/components/PrescriptionForm.tsx`
- Form fields:
  - Patient selector (dropdown, load from GET `/api/patients` if exists, or hardcoded)
  - Medication selector (dropdown, load from GET `/api/medications`)
  - Dosage input (text)
  - Frequency input (text)
  - Duration input (text)
  - Create button
- On submit:
  - POST `/api/prescriptions` with form data
  - If 201: close form, reload prescription list
  - If 400: show validation error
  - If 403: show "Not authorized" (should not happen)

**Success**: Doctor can create prescription from form.

---

**Task: Implement Prescription Detail Page**
- File: `frontend/src/pages/PrescriptionDetail.tsx`
- Load prescription:
  - GET `/api/prescriptions/:id`
- Display:
  - Prescription ID
  - Doctor name
  - Patient name
  - Medication name
  - Dosage, frequency, duration
  - Current status (badge)
  - Timestamps: created_at, signed_at, sent_at, received_at, dispensed_at
- Show action buttons based on status:
  - If DRAFTED: Sign, Revert (disabled), Send (disabled color), Delete/Discard
  - If SIGNED: Sign (disabled), Revert, Send, Delete/Discard
  - If SENT+: All disabled
- On button click:
  - Doctor: PUT `/api/prescriptions/:id/sign`, PUT `.../revert-to-draft`, PUT `.../send`
  - On success: update UI, reload prescription
  - On error: show error message

**Success**: Doctor can sign, revert, send from detail page.

---

### Pharmacy Dashboard Tasks

**Task: Implement Pharmacy Queue**
- File: `frontend/src/pages/PharmacyQueue.tsx`
- Load assigned prescriptions:
  - GET `/api/prescriptions`
  - Filter for status IN (SENT, RECEIVED, DISPENSED)
- Display in table: ID, Patient, Medication, Status, Received (timestamp), Dispensed (timestamp)
- For status = SENT: show Receive button
- For status = RECEIVED: show Dispense button
- On button click:
  - PUT `/api/prescriptions/:id/receive` or `dispense`
  - If 200: reload queue
  - If 403: show "Not assigned to your pharmacy"

**Success**: Pharmacy sees assigned prescriptions, can receive and dispense.

---

### Patient Dashboard Tasks

**Task: Implement Patient Prescription List**
- File: `frontend/src/pages/PatientDashboard.tsx`
- Load patient's visible prescriptions:
  - GET `/api/prescriptions`
  - Filter for status IN (SENT, RECEIVED, DISPENSED, CANCELLED, EXPIRED)
- Display in timeline:
  - Prescription ID
  - Doctor name
  - Medication name
  - Current status with timestamp
  - Visual timeline: Created → Sent → Received → Dispensed
- Click to view detail

**Success**: Patient sees only visible prescriptions in timeline format.

---

**Task: Implement Patient Prescription Detail**
- File: `frontend/src/pages/PatientDetail.tsx`
- Load prescription: GET `/api/prescriptions/:id`
- Display:
  - Prescription ID
  - Doctor name
  - Medication and dosage
  - Pharmacy name and location (if dispensed)
  - Status timeline with actual timestamps
  - Status badge
- Read-only (no action buttons)

**Success**: Patient sees complete prescription journey timeline.

---

### Admin Dashboard Tasks

**Task: Implement Admin Dashboard**
- File: `frontend/src/pages/AdminDashboard.tsx`
- Show:
  - Link to Audit Logs
  - System metrics (if implemented): total prescriptions, total users, etc.
  - Recent audit summary (last 10 actions)

**Success**: Admin can navigate to audit logs.

---

**Task: Implement Audit Log UI**
- File: `frontend/src/pages/AuditLogs.tsx`
- Load audit logs: GET `/api/audit-logs?startDate=X&endDate=Y&action=X&userId=X`
- Display in table: User, Action, Resource, Status, IP Address, Timestamp
- Add filters:
  - User dropdown (load users)
  - Action dropdown (hardcoded actions list)
  - Date range (start/end pickers)
- On row click: show full audit entry details (old_value, new_value as JSON)
- Pagination (load 50 per page)

**Success**: Admin can view, filter, and search audit logs.

---

## QA / Testing Tasks

### Pre-Testing Setup

**Task: Create Test User Credentials Document**
- Document: `docs/TEST_USERS.md`
- List seed credentials:
  - Admin: admin@prescribe.local / Demo1234!
  - Doctor 1: doctor1@prescribe.local / Demo1234!
  - Doctor 2: doctor2@prescribe.local / Demo1234!
  - Pharmacy 1: pharmacy1@prescribe.local / Demo1234!
  - Pharmacy 2: pharmacy2@prescribe.local / Demo1234!
  - Patient 1..5: patient1..5@prescribe.local / Demo1234!

**Success**: Team has consistent test credentials.

---

### API Testing Tasks

**Task: Create Postman Collection**
- File: `prescribe-platform.postman_collection.json`
- Auth section:
  - POST /api/auth/login (run as first request)
  - Tests: save token from response, use in subsequent requests
- Doctor section:
  - POST /api/prescriptions
  - PUT /api/prescriptions/:id/sign
  - PUT /api/prescriptions/:id/revert-to-draft
  - PUT /api/prescriptions/:id/send
  - GET /api/prescriptions
  - Tests: verify status codes, check response schema
- Pharmacy section:
  - GET /api/prescriptions (with pharmacy user context)
  - PUT /api/prescriptions/:id/receive
  - PUT /api/prescriptions/:id/dispense
- Patient section:
  - GET /api/prescriptions (with patient context)
  - Tests: verify DRAFTED/SIGNED not in response
- Admin section:
  - GET /api/audit-logs
  - Tests: verify all actions logged

**Success**: Full API flow testable from Postman.

---

### Authorization Testing Tasks

**Task: Test Cross-Role Access Denial**
- Doctor 1 logs in
  - Try to access Doctor 2's prescriptions → 403
  - Try to send prescription without signing first → 400 or 422
- Pharmacy 1 logs in
  - Try to access Pharmacy 2's prescriptions → 403
  - Try to receive prescription not assigned to them → 403
  - Try to dispense SENT prescription (not yet received) → 400 or 422
- Patient logs in
  - GET `/api/prescriptions` → verify no DRAFTED or SIGNED returned
  - Try to access another patient's prescription → 403
  - Try to sign using API endpoint → 403
- Admin logs in
  - Try to GET `/api/prescriptions` → 403

**Success**: Denied requests return expected status codes.

---

**Task: Test Lifecycle Transitions**
- Using Postman collection or test script:
  - Create prescription → status = DRAFTED
  - Try to send DRAFTED directly → 400
  - Sign → status = SIGNED
  - Send → status = SENT
  - Try to edit SENT prescription → 400 or 403
  - Switch to pharmacy user
  - Receive → status = RECEIVED
  - Dispense → status = DISPENSED
  - Try to edit or cancel DISPENSED → 400 or 403

**Success**: Only valid transitions work. Invalid transitions fail clearly.

---

**Task: Test Audit Logging**
- Run complete happy path
- Check audit_logs table:
  - Create draft logged
  - Sign logged
  - Send logged
  - Receive logged
  - Dispense logged
  - 5 entries total minimum
- Verify audit fields populated:
  - user_id, action, resource_type, resource_id, old_value, new_value, status, created_at

**Success**: Every action has audit entry with all required fields.

---

### E2E Testing Tasks

**Task: Execute Complete Happy Path**
- Day 1: Doctor
  - Log in as doctor1
  - Create prescription for patient1, amoxicillin, 500mg
  - Sign prescription
  - Send to pharmacy1
  - Verify status = SENT
  - Check audit log: 3 entries

- Day 2: Pharmacy
  - Log in as pharmacy1
  - View prescription queue
  - Receive prescription
  - Verify status = RECEIVED
  - Dispense prescription
  - Verify status = DISPENSED
  - Check audit log: 2 new entries (5 total)

- Day 3: Patient
  - Log in as patient1
  - View prescriptions
  - Verify prescription appears
  - Verify status = DISPENSED
  - View detail page
  - Verify timeline shows: Sent, Received, Dispensed with timestamps

- Day 4: Admin
  - Log in as admin
  - View audit logs
  - Filter by doctor1, verify 3 entries
  - Filter by pharmacy1, verify 2 entries
  - Verify no raw prescription content visible

**Success**: Complete happy path works. Audit trail matches actions.

---

### Bug Reporting Tasks

**Task: Create Bug Template**
- For any blocking issues:
  - Title: one-line summary
  - Steps to reproduce
  - Expected result
  - Actual result
  - Screenshot/logs
  - Whether it blocks other work
- Priority: Critical (blocks Phase 1), High (should fix), Medium (polish)

**Success**: Structured bugs enable quick triage and fix.

---

## Summary

**Backend**: 10–12 core tasks (DB, auth, RBAC, APIs, audit)  
**Frontend**: 10–12 core tasks (login, dashboards, forms, pages)  
**QA**: 5–7 test tasks (Postman, authorization checks, happy path, e2e)

Each role can work in parallel. Backend should be ~70% done before frontend integration starts.
