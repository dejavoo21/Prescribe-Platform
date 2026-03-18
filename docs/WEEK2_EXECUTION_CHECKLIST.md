# WEEK2_EXECUTION_CHECKLIST

**Project**: Prescribe Platform  
**Phase**: Phase 1 MVP  
**Week**: Week 2 Execution  
**Status**: Ready to start (depends on Week 1 completion)

---

## Objective for Week 2

By the end of Week 2, the team must have:

- pharmacy receive and dispense workflows implemented
- patient prescription status view implemented
- complete audit logging for all mutations
- end-to-end happy path working (doctor → pharmacy → patient)
- admin audit log UI accessible
- Phase 1 MVP fully functional and tested

Week 2 is about **completing the happy path + closing audit gaps**.

---

## Prerequisite: Week 1 Complete

Do not start Week 2 until ALL of these are true:

- [ ] Doctor can create, sign, send prescriptions
- [ ] Auth works for all 4 roles
- [ ] No critical RBAC bugs
- [ ] Audit logs table exists and records mutations
- [ ] Frontend login page works
- [ ] No blocking bugs from Week 1

If any blocker exists, raise it before Monday.

---

# Day 6 (Monday) — Pharmacy Receive & Dispense APIs

## Backend
- [ ] Implement `PUT /api/prescriptions/:id/receive`
  - [ ] Require pharmacy role
  - [ ] Require pharmacy assignment
  - [ ] Require status = SENT
  - [ ] Update status to RECEIVED
  - [ ] Set received_at timestamp
  - [ ] Prevent content edits
  - [ ] Create notification for doctor
  - [ ] Create notification for patient

- [ ] Implement `PUT /api/prescriptions/:id/dispense`
  - [ ] Require pharmacy role
  - [ ] Require pharmacy assignment
  - [ ] Require status = RECEIVED
  - [ ] Update status to DISPENSED
  - [ ] Set dispensed_at timestamp
  - [ ] Store dispensing details (if any)
  - [ ] Create notification for patient
  - [ ] Prevent future edits

- [ ] Implement `GET /api/prescriptions` for pharmacy
  - [ ] Filter by pharmacy_id
  - [ ] Show only assigned prescriptions
  - [ ] Show only statuses SENT, RECEIVED, DISPENSED
  - [ ] Never show unassigned prescriptions

## Audit
- [ ] Log receive action
- [ ] Log dispense action
- [ ] Log denied receive attempts
- [ ] Log denied dispense attempts

## Validation
- [ ] Pharmacy 1 cannot dispense Pharmacy 2's prescriptions
- [ ] Pharmacy cannot receive draft prescriptions
- [ ] Pharmacy cannot dispense before receiving
- [ ] Audit entries written for all actions

---

# Day 7 (Tuesday) — Patient Prescription View

## Backend
- [ ] Implement `GET /api/prescriptions` for patient
  - [ ] Filter by patient_id
  - [ ] Filter by visible statuses only: SENT, RECEIVED, DISPENSED, CANCELLED, EXPIRED
  - [ ] Return safe fields only (no patient PII beyond what patient already knows)
  - [ ] Do NOT return draft/signed prescriptions

- [ ] Implement `GET /api/prescriptions/:id` for patient
  - [ ] Return selected prescription only if owned by patient
  - [ ] Return only if status is visible
  - [ ] Show doctor name, pharmacy name, medication, dosage
  - [ ] Show status timeline (when created, signed, sent, received, dispensed)

## Frontend
- [ ] Create patient dashboard
  - [ ] List patient's visible prescriptions
  - [ ] Show status badges (SENT, RECEIVED, DISPENSED, etc.)
  - [ ] Click to view prescription details
  - [ ] Show notification count if implemented

- [ ] Create patient prescription detail page
  - [ ] Show doctor name
  - [ ] Show medication details
  - [ ] Show dosage and frequency
  - [ ] Show pharmacy name and location (if dispensed)
  - [ ] Show status timeline
  - [ ] Show timestamps

## Validation
- [ ] Patient cannot view draft/signed prescriptions
- [ ] Patient 1 cannot see Patient 2's prescriptions
- [ ] Patient sees correct prescription count
- [ ] Status timeline accurate

---

# Day 8 (Wednesday) — Complete Audit Logging

## Backend
- [ ] Wire audit logging for all remaining mutations:
  - [ ] Receive action
  - [ ] Dispense action
  - [ ] All denied attempts
  - [ ] Invalid state transitions

- [ ] Ensure audit fields are complete:
  - [ ] user_id
  - [ ] action
  - [ ] resource_type
  - [ ] resource_id
  - [ ] old_value (JSON)
  - [ ] new_value (JSON)
  - [ ] status (success or denied)
  - [ ] ip_address
  - [ ] created_at

- [ ] Implement `GET /api/audit-logs` for admin
  - [ ] Require admin role
  - [ ] Filter by date range
  - [ ] Filter by action
  - [ ] Filter by resource type
  - [ ] Filter by user
  - [ ] Return paginated results
  - [ ] Preserve immutability (never delete or edit)

- [ ] Test audit completeness:
  - [ ] Create prescription logged
  - [ ] Sign logged
  - [ ] Revert logged
  - [ ] Send logged
  - [ ] Receive logged
  - [ ] Dispense logged
  - [ ] Denied attempts logged
  - [ ] Invalid transitions logged

---

# Day 9 (Thursday) — Admin Audit Log UI + End-to-End Testing

## Frontend
- [ ] Create admin audit log page
  - [ ] Display audit log entries in table
  - [ ] Filter by user (dropdown)
  - [ ] Filter by action (dropdown)
  - [ ] Filter by date range (date picker)
  - [ ] Show pagination
  - [ ] Show full audit details on click

- [ ] Create admin dashboard
  - [ ] Link to audit logs
  - [ ] Show system metrics (prescription count, user count)
  - [ ] Show recent actions summary

## E2E Testing
- [ ] Run complete happy path flow:
  - [ ] Doctor logs in
  - [ ] Doctor creates prescription (audit check)
  - [ ] Doctor signs prescription (audit check)
  - [ ] Doctor sends to pharmacy (audit check)
  - [ ] Pharmacy logs in (separate user)
  - [ ] Pharmacy receives prescription (audit check)
  - [ ] Pharmacy dispenses prescription (audit check)
  - [ ] Patient logs in (separate user)
  - [ ] Patient views prescriptions (sees only sent/received/dispensed)
  - [ ] Admin views audit log (sees all actions)

- [ ] Cross-role authorization test:
  - [ ] Doctor cannot see pharmacy queue
  - [ ] Pharmacy cannot see doctor's drafts
  - [ ] Patient cannot see other patients
  - [ ] Admin cannot create prescriptions

- [ ] Invalid transition tests:
  - [ ] Doctor tries to send draft → 400
  - [ ] Pharmacy tries to dispense sent prescription → 400
  - [ ] Patient tries to sign → 403
  - [ ] Doctor 2 tries to send Doctor 1's prescription → 403

---

# Day 10 (Friday) — Phase 1 Bug Fixes & Demo Prep

## Final Bug Fixes
- [ ] Any blocking issues from E2E testing
- [ ] Any auth/RBAC edge cases
- [ ] Any UI/UX issues
- [ ] Any audit logging gaps

## Documentation
- [ ] Create Phase 1 MVP reference guide
- [ ] Update API documentation with full endpoints
- [ ] Create user guide for each role
- [ ] Update README with latest setup instructions
- [ ] Create demo script (steps to follow for live demo)

## Phase 1 Acceptance Criteria
- [ ] All locked design constraints met
- [ ] No unauthorized access possible
- [ ] All mutations audited
- [ ] Unit tests passing
- [ ] Happy path validated
- [ ] No hard deletes exist
- [ ] Passwords never plain text
- [ ] Patient visibility enforced

## Demo Preparation
- [ ] Clean database state
- [ ] Test seed data loaded
- [ ] All 4 role users available for live demo
- [ ] Demo script prepared
- [ ] Screenshots/screen recording ready

---

# Week 2 QA Checklist

## Pharmacy Workflow
- [ ] Pharmacy can view assigned prescriptions
- [ ] Pharmacy cannot see unassigned prescriptions
- [ ] Pharmacy can receive SENT prescription
- [ ] Pharmacy cannot receive draft
- [ ] Pharmacy can dispense RECEIVED prescription
- [ ] Prescription locked after dispense

## Patient Workflow
- [ ] Patient logs in
- [ ] Patient sees own prescriptions only
- [ ] Patient cannot see draft/signed
- [ ] Patient can see SENT → RECEIVED → DISPENSED timeline
- [ ] Patient sees doctor name, pharmacy, medication

## Admin Workflow
- [ ] Admin logs in
- [ ] Admin views audit logs
- [ ] Admin cannot open prescription content
- [ ] Admin sees all audit entries
- [ ] Audit filter by user works
- [ ] Audit filter by action works

## Audit Logging
- [ ] Every prescription action logged
- [ ] old_value and new_value populated
- [ ] Denied attempts logged
- [ ] IP address captured
- [ ] Timestamps accurate

## Authorization
- [ ] Doctor 1 cannot send Doctor 2's prescriptions
- [ ] Pharmacy 1 cannot dispense Pharmacy 2's prescriptions
- [ ] Patient 1 cannot see Patient 2's prescriptions
- [ ] Invalid role cannot perform action
- [ ] Invalid state transition rejected

---

# End-of-Week 2 Definition of Done

Week 2 is complete only if:

- [ ] Complete happy path works end-to-end
- [ ] Doctor creates, signs, sends
- [ ] Pharmacy receives, dispenses
- [ ] Patient views visible prescriptions only
- [ ] All actions audited
- [ ] Admin sees audit logs
- [ ] No RBAC bypasses exist
- [ ] No hard deletes exist
- [ ] All validation tests pass
- [ ] Demo ready

---

# Phase 1 Complete When

The Phase 1 MVP is complete when all of the following are true:

## Functional
- [ ] Doctor workflow 100% functional
- [ ] Pharmacy workflow 100% functional
- [ ] Patient workflow 100% functional
- [ ] Admin audit workflow 100% functional

## Security
- [ ] Authentication working for all roles
- [ ] Authorization enforced at route + resource level
- [ ] Patient visibility rule enforced in queries
- [ ] Admin blocked from prescription content by default
- [ ] All authorization failures logged
- [ ] No plaintext passwords in database

## Data Integrity
- [ ] Lifecycle transitions validated in database
- [ ] Status immutable once set (except mutable timestamps)
- [ ] Prescriptions never hard-deleted
- [ ] Audit logs never hard-deleted
- [ ] Timestamps immutable once set
- [ ] All SQL parameterized

## Audit & Compliance
- [ ] Every mutation logged
- [ ] Every denied access logged
- [ ] Every invalid transition logged
- [ ] Audit entries contain all required fields
- [ ] Audit UI operational

## Testing
- [ ] Happy path tested end-to-end
- [ ] Authorization tests pass
- [ ] Invalid transition tests pass
- [ ] Cross-role access tests pass
- [ ] Audit logging tests pass

## Documentation
- [ ] API reference complete
- [ ] User guides for each role
- [ ] Architecture decision log
- [ ] Demo script prepared
- [ ] Setup instructions clear

---

# Known Issues / Backlog for Phase 2+

Do not work on these in Week 2:

- [ ] Refill workflows
- [ ] Partial dispensing
- [ ] Prescription corrections
- [ ] Organization/clinic boundaries
- [ ] Advanced notifications (email, SMS)
- [ ] Mobile app
- [ ] FHIR integration
- [ ] Multi-factor authentication
- [ ] Password reset
- [ ] Advanced reporting
- [ ] External pharmacy gateway
- [ ] Delegation/proxy access
- [ ] Break-glass workflows

---

# Blockers to Raise Immediately

If any of these happen during Week 2, raise immediately:

- [ ] Audit logging not writing to database
- [ ] Patient can view draft/signed prescriptions
- [ ] Pharmacy can see unassigned prescriptions
- [ ] Admin can open prescription content endpoints
- [ ] Lifecycle transitions not validated
- [ ] Hard delete possible on prescriptions/audit logs
- [ ] Password stored plaintext
- [ ] Role not loaded correctly into request
- [ ] Profile ID mapping broken
- [ ] Major performance issue identified
- [ ] Any unauthorized access loophole discovered

---

# Weekly Standups

**Monday 9 AM**: Pharmacy workflow review
**Tuesday 9 AM**: Patient view review
**Wednesday 9 AM**: Audit logging checkpoint
**Thursday 9 AM**: E2E testing status
**Friday 4 PM**: Phase 1 readiness review

---

# Success = EoD Friday

**Doctor → Pharmacy → Patient → Audit Log all working.**

**Phase 1 MVP ready for stakeholder demo.**
