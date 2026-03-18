# PHASE1_EXECUTION_RUNBOOK

**Project**: Prescribe Platform  
**Phase**: Phase 1 MVP  
**Purpose**: Real build script for engineering execution  
**Status**: Implementation baseline

---

## 1. Build Goal

Deliver a working Phase 1 prescription workflow with:

- secure login for all 4 roles
- role-based authorization
- doctor create/sign/send flow
- pharmacy receive/dispense flow
- patient visibility from `SENT` onward
- admin audit review
- audit logging on every implemented mutation

This is not a prototype presentation script.  
This is the actual build sequence.

---

## 2. Non-Negotiable Rules

- Do not change lifecycle states without review
- Do not give admin default prescription-content access
- Do not store tokens in localStorage
- Do not use `SELECT *` on sensitive tables
- Do not bypass resource ownership checks
- Do not hard-delete prescriptions or audit logs
- Do not implement deferred Phase 2 features in Phase 1

---

## 3. Engineering Sequence

### Step 1 — Database

Build and verify:

- `users`
- `doctors`
- `pharmacies`
- `patients`
- `medications`
- `prescriptions`
- `audit_logs`
- `notifications`

Required outputs:

- initial migration file
- rollback-safe migration approach
- seed script
- indexes and foreign keys
- lifecycle status constraints
- timestamp columns
- soft-delete/discard handling for drafts only

Completion criteria:

- fresh DB can migrate successfully
- seed script runs successfully
- doctor/pharmacy/patient/admin test users exist
- sample medication data exists
- sample prescription data exists

---

### Step 2 — Authentication

Build and verify:

- login endpoint
- password hashing with bcrypt
- JWT issue/verify flow
- secure httpOnly cookie handling
- auth middleware
- request user context hydration

Request context must include:

- `userId`
- `role`
- `doctorProfileId` where applicable
- `pharmacyProfileId` where applicable
- `patientProfileId` where applicable

Completion criteria:

- all 4 roles can log in
- invalid credentials fail safely
- disabled accounts are blocked
- password hashes never leave API responses

---

### Step 3 — Authorization

Implement 3-layer enforcement:

1. authentication
2. role check
3. resource ownership/assignment check

Locked rules:

- doctor can access own prescriptions only
- pharmacy can access assigned prescriptions only
- patient can access own visible prescriptions only
- admin can access audit and admin functions only

Completion criteria:

- cross-user access fails
- patient cannot view `DRAFTED` or `SIGNED`
- admin cannot open prescription detail by default
- all sensitive queries use allowlisted fields

---

### Step 4 — Prescription Lifecycle API

Implement exactly these endpoints:

- `POST /api/prescriptions` → create draft
- `PUT /api/prescriptions/:id/sign`
- `PUT /api/prescriptions/:id/revert-to-draft`
- `PUT /api/prescriptions/:id/send`
- `PUT /api/prescriptions/:id/receive`
- `PUT /api/prescriptions/:id/dispense`
- `PUT /api/prescriptions/:id/cancel`
- `PUT /api/prescriptions/:id/discard`

System job or scheduled handler:

- expire eligible prescriptions → `EXPIRED`

Completion criteria:

- invalid state transitions fail
- DB update checks current status in `WHERE` clause
- timestamps are set correctly
- sent prescriptions become content-locked
- dispensed prescriptions become immutable

---

### Step 5 — Audit Logging

Audit these actions:

- create draft
- sign
- revert to draft
- send
- receive
- dispense
- cancel
- discard
- expire
- denied lifecycle actions where implemented

Audit record minimum fields:

- `user_id`
- `action`
- `resource_type`
- `resource_id`
- `old_value`
- `new_value`
- `status`
- `ip_address`
- `created_at`

Completion criteria:

- every implemented mutation writes an audit entry
- failed/denied protected actions are captured where required
- audit writes happen in the same transaction where practical

---

### Step 6 — Frontend Integration

Implement role-aware frontend flow:

#### Doctor
- login
- dashboard
- prescription list
- create draft
- sign
- revert
- send

#### Pharmacy
- login
- assigned prescription queue
- receive
- dispense

#### Patient
- login
- visible prescription list
- status tracking from `SENT` onward

#### Admin
- login
- audit log view
- user/account management view if included

Completion criteria:

- protected routes work
- role routing works
- unauthorized pages are blocked
- lifecycle actions call real backend endpoints
- UI does not expose forbidden actions

---

## 4. Locked Status Rules

Active Phase 1 statuses:

- `DRAFTED`
- `SIGNED`
- `SENT`
- `RECEIVED`
- `DISPENSED`
- `CANCELLED`
- `EXPIRED`

Deferred, not active in Phase 1 logic:

- `DISPENSING`
- `COMPLETED`

Patient visibility begins only at:

- `SENT`
- `RECEIVED`
- `DISPENSED`
- `CANCELLED`
- `EXPIRED`

---

## 5. Required Test Coverage

### Authentication
- valid login per role
- invalid login rejection
- disabled user rejection

### Authorization
- doctor blocked from other doctor prescriptions
- pharmacy blocked from unassigned prescriptions
- patient blocked from other patient prescriptions
- admin blocked from raw prescription content

### Lifecycle
- `DRAFTED -> SIGNED`
- `SIGNED -> DRAFTED`
- `SIGNED -> SENT`
- `SENT -> RECEIVED`
- `RECEIVED -> DISPENSED`
- invalid transitions rejected

### Audit
- every implemented mutation logged
- sensitive denied actions logged where required

### Patient visibility
- patient sees `SENT+`
- patient does not see `DRAFTED`
- patient does not see `SIGNED`

---

## 6. Engineering Delivery Order

### Backend first
1. migration
2. seed
3. auth
4. RBAC
5. prescription endpoints
6. audit logging

### Frontend second
1. login
2. route guards
3. doctor flow
4. pharmacy flow
5. patient status
6. admin audit view

### QA continuously
- test each role after each endpoint lands
- test denied paths, not only happy paths

---

## 7. Definition of Done

Phase 1 is complete only when all are true:

- doctor can create, sign, and send
- pharmacy can receive and dispense
- patient can view own prescription from `SENT` onward
- admin can review audit logs
- lifecycle transitions are enforced in code and DB queries
- no critical authorization leak exists
- no critical audit gap exists
- no prescription content is editable after `SENT`
- no raw prescription access exists for admin by default

---

## 8. Immediate Stop Conditions

Pause implementation and review if any of these happen:

- lifecycle requires unapproved new statuses
- admin is given direct prescription read access
- profile IDs and user IDs are being confused
- frontend exposes actions forbidden by lifecycle
- audit logging is skipped for speed
- devs start implementing Phase 2 scope in Phase 1
