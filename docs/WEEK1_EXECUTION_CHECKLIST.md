# WEEK1_EXECUTION_CHECKLIST

**Project**: Prescribe Platform  
**Phase**: Phase 1 MVP  
**Week**: Week 1 Execution  
**Status**: Ready to start

---

## Objective for Week 1

By the end of Week 1, the team must have:

- database schema running
- seed data available
- authentication working
- authorization enforced
- doctor able to create, sign, and send a prescription
- frontend connected for login and doctor workflow
- audit logging wired for implemented actions

Week 1 is about **foundation + first doctor workflow**.

---

## Locked Rules for This Week

Before building, confirm:

- [ ] `PRESCRIPTION_LIFECYCLE.md` is the source of truth
- [ ] `AUTHORIZATION_POLICY.md` is the source of truth
- [ ] no one is implementing `DISPENSING` or `COMPLETED` in Phase 1
- [ ] no one is storing tokens in localStorage
- [ ] no one is giving admin default access to prescription content
- [ ] no one is adding unapproved schema changes without review

---

# Day 1 — Database & Seed Data

## Backend
- [ ] Create PostgreSQL database for `prescribe-platform`
- [ ] Create initial migration file
- [ ] Create `users` table
- [ ] Create `doctors` table
- [ ] Create `pharmacies` table
- [ ] Create `patients` table
- [ ] Create `medications` table
- [ ] Create `prescriptions` table
- [ ] Create `audit_logs` table
- [ ] Create `notifications` table
- [ ] Add foreign keys and indexes
- [ ] Add enum/check constraints for locked prescription statuses
- [ ] Add timestamp columns (`created_at`, `updated_at`, `signed_at`, `sent_at`, `received_at`, `dispensed_at`, `cancelled_at`, `expired_at`)
- [ ] Ensure prescriptions are never hard-deleted
- [ ] Ensure audit logs are never hard-deleted

## Seed Data
- [ ] Create one admin user
- [ ] Create one doctor user + doctor profile
- [ ] Create one pharmacy user + pharmacy profile
- [ ] Create one patient user + patient profile
- [ ] Seed sample medications
- [ ] Seed at least one draft prescription for testing
- [ ] Seed passwords using bcrypt hash, not plaintext

## Validation
- [ ] Migration runs successfully on clean DB
- [ ] Seed script runs successfully on clean DB
- [ ] All foreign key relationships verified
- [ ] Test query returns doctor, pharmacy, patient, and prescription correctly linked

---

# Day 2 — Authentication

## Backend
- [ ] Implement register endpoint for approved MVP flow if needed
- [ ] Implement login endpoint
- [ ] Implement password verification with bcrypt
- [ ] Implement JWT generation
- [ ] Store auth token using secure httpOnly cookie strategy
- [ ] Implement auth middleware
- [ ] Attach authenticated user context to request
- [ ] Include role in request context
- [ ] Include profile IDs in request context:
  - [ ] doctorProfileId
  - [ ] pharmacyProfileId
  - [ ] patientProfileId

## Security
- [ ] Reject invalid password attempts
- [ ] Reject disabled users
- [ ] Reject users with invalid role/profile mapping
- [ ] Ensure no password hash is returned in API response
- [ ] Ensure cookie settings are correct for environment

## Validation
- [ ] Admin can log in
- [ ] Doctor can log in
- [ ] Pharmacy can log in
- [ ] Patient can log in
- [ ] Invalid credentials return correct error
- [ ] Authenticated request resolves correct role and profile ID

---

# Day 3 — Authorization & Protected Access

## Backend
- [ ] Implement role authorization middleware
- [ ] Implement resource ownership checks in service layer
- [ ] Enforce doctor access to own prescriptions only
- [ ] Enforce pharmacy access to assigned prescriptions only
- [ ] Enforce patient access to own visible prescriptions only
- [ ] Enforce admin denial for prescription content by default
- [ ] Enforce patient visibility rule from `SENT` onward only

## Query Safety
- [ ] Remove `SELECT *` from sensitive queries
- [ ] Use explicit allowlisted columns for patient data
- [ ] Use parameterized SQL only
- [ ] Ensure all prescription queries include ownership/assignment filters

## Validation
- [ ] Doctor cannot access another doctor's prescription
- [ ] Pharmacy cannot access another pharmacy's prescription
- [ ] Patient cannot access another patient's prescription
- [ ] Patient cannot view `DRAFTED` or `SIGNED`
- [ ] Admin can access audit log endpoint
- [ ] Admin cannot access prescription detail endpoint by default

---

# Day 4 — Prescription API: Doctor Flow

## Backend
- [ ] Implement `POST /api/prescriptions` → create draft
- [ ] Implement `PUT /api/prescriptions/:id/sign`
- [ ] Implement `PUT /api/prescriptions/:id/revert-to-draft`
- [ ] Implement `PUT /api/prescriptions/:id/send`
- [ ] Enforce lifecycle transitions in DB update queries
- [ ] Lock prescription content after `SENT`
- [ ] Validate selected pharmacy exists and is active
- [ ] Validate patient belongs to doctor's allowed scope
- [ ] Validate medication exists
- [ ] Validate required fields: dosage, frequency, duration

## Audit
- [ ] Audit draft creation
- [ ] Audit sign action
- [ ] Audit revert-to-draft action
- [ ] Audit send action
- [ ] Audit denied mutation attempts where implemented

## Notifications
- [ ] Stub notification creation on send
- [ ] Create notification row for pharmacy
- [ ] Create notification row for patient

## Validation
- [ ] Doctor can create draft
- [ ] Doctor can sign draft
- [ ] Doctor can revert signed prescription to draft
- [ ] Doctor can send signed prescription
- [ ] Doctor cannot send draft directly
- [ ] Doctor cannot modify prescription after send
- [ ] Audit entries are written for each action

---

# Day 5 — Frontend Login + Doctor Workflow

## Frontend Auth
- [ ] Connect login form to backend
- [ ] Store authenticated state safely
- [ ] Implement protected routes
- [ ] Route user by role after login
- [ ] Show correct dashboard per role
- [ ] Handle logout properly

## Doctor UI
- [ ] Doctor dashboard loads
- [ ] Prescription list page loads doctor's own prescriptions
- [ ] Create prescription form works
- [ ] Sign action works
- [ ] Revert-to-draft action works
- [ ] Send action works
- [ ] Validation errors shown clearly
- [ ] Success states shown clearly

## API Integration
- [ ] Frontend API client configured
- [ ] Error handling for 401/403/500
- [ ] Loading states for doctor actions
- [ ] Role-aware route guard working

## Validation
- [ ] Doctor logs in from UI
- [ ] Doctor sees own prescriptions only
- [ ] Doctor creates draft from UI
- [ ] Doctor signs from UI
- [ ] Doctor sends from UI
- [ ] Sent prescription no longer editable in UI

---

# Week 1 QA Checklist

## Authentication
- [ ] Valid login works for each role
- [ ] Invalid login rejected
- [ ] Protected route redirects unauthenticated users
- [ ] Wrong-role access rejected

## Authorization
- [ ] Doctor cannot view another doctor's prescriptions
- [ ] Patient cannot view draft or signed prescriptions
- [ ] Pharmacy cannot access unassigned prescriptions
- [ ] Admin cannot open prescription content endpoint

## Lifecycle
- [ ] Draft → Signed works
- [ ] Signed → Sent works
- [ ] Draft → Sent fails
- [ ] Signed → Draft works
- [ ] Sent prescription cannot be edited

## Audit
- [ ] Create draft logged
- [ ] Sign logged
- [ ] Revert logged
- [ ] Send logged
- [ ] Denied action logged where implemented

---

# End-of-Week 1 Definition of Done

Week 1 is complete only if all of the following are true:

- [ ] DB migration works from scratch
- [ ] Seed script works from scratch
- [ ] Auth works for all four roles
- [ ] Role and resource authorization both enforced
- [ ] Doctor can create draft
- [ ] Doctor can sign draft
- [ ] Doctor can revert signed draft
- [ ] Doctor can send prescription
- [ ] Sent prescription is visible to patient query logic only when allowed
- [ ] Sent prescription is assigned to a pharmacy
- [ ] Audit log is written for all implemented prescription mutations
- [ ] Frontend doctor flow works end to end
- [ ] No critical auth, RBAC, or lifecycle bugs remain open

---

# Carry Forward to Week 2

These items move into Week 2:

- [ ] Pharmacy receive flow
- [ ] Pharmacy dispense flow
- [ ] Patient prescription status view
- [ ] Admin audit log UI
- [ ] End-to-end happy path demo
- [ ] Final Phase 1 bug fix pass

---

# Blockers That Must Be Raised Immediately

Raise immediately if any of these happen:

- [ ] schema does not support locked lifecycle
- [ ] user account does not map cleanly to profile ID
- [ ] auth cookie strategy is inconsistent
- [ ] admin is being granted raw prescription access
- [ ] patient can see draft/signed records
- [ ] lifecycle transitions are being bypassed in code
- [ ] audit logs are missing for mutations
- [ ] team proposes unapproved microservice split
