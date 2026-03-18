# PHASE1_FINAL_REVIEW_CHECKLIST

**Project**: Prescribe Platform  
**Phase**: Phase 1 MVP  
**Purpose**: Final engineering review before calling Phase 1 implementation-complete  
**Status**: Final gate

---

## 1. Locked Design Alignment

- [ ] `PHASE1_LOCKED_DESIGN.md` is still the source of truth
- [ ] `AUTHORIZATION_POLICY.md` matches actual backend behavior
- [ ] `PRESCRIPTION_LIFECYCLE.md` matches actual backend behavior
- [ ] No unapproved lifecycle states were added
- [ ] No Phase 2 features were pulled into Phase 1
- [ ] Admin still has no default raw prescription-content access
- [ ] Patient visibility still begins only at `SENT`

---

## 2. Database & Data Integrity

- [ ] Fresh database migration runs successfully
- [ ] Seed script runs successfully
- [ ] Users map correctly to profile IDs
- [ ] Prescription status constraints are enforced
- [ ] Timestamp fields populate correctly
- [ ] Prescriptions are never hard-deleted
- [ ] Audit logs are never hard-deleted
- [ ] Version/concurrency protection works as intended
- [ ] No invalid foreign key relationships remain

---

## 3. Authentication

- [ ] Admin can log in
- [ ] Doctor can log in
- [ ] Pharmacy can log in
- [ ] Patient can log in
- [ ] Invalid password is rejected
- [ ] Disabled user is rejected
- [ ] Auth token stored via secure httpOnly cookie strategy
- [ ] No auth tokens stored in localStorage
- [ ] `/api/auth/me` returns correct role and profile context
- [ ] Logout clears session correctly

---

## 4. Authorization & RBAC

- [ ] Doctor can access only own prescriptions
- [ ] Pharmacy can access only assigned prescriptions
- [ ] Patient can access only own visible prescriptions
- [ ] Admin can access audit/admin routes only
- [ ] Admin cannot open raw prescription content by default
- [ ] Route-level role checks are present
- [ ] Service-level ownership checks are present
- [ ] Sensitive queries use allowlisted fields
- [ ] No `SELECT *` remains on sensitive tables

---

## 5. Prescription Lifecycle

### Doctor flow
- [ ] Create draft works
- [ ] Sign works
- [ ] Revert to draft works
- [ ] Send works
- [ ] Discard works
- [ ] Cancel works in allowed states only

### Pharmacy flow
- [ ] Receive works
- [ ] Dispense works
- [ ] Cancel works in allowed states only

### Patient flow
- [ ] Patient sees own prescriptions from `SENT` onward only
- [ ] Patient does not see `DRAFTED`
- [ ] Patient does not see `SIGNED`
- [ ] Patient sees correct visible terminal states

### Lifecycle guards
- [ ] `DRAFTED -> SIGNED` allowed
- [ ] `SIGNED -> DRAFTED` allowed
- [ ] `SIGNED -> SENT` allowed
- [ ] `SENT -> RECEIVED` allowed
- [ ] `RECEIVED -> DISPENSED` allowed
- [ ] `DRAFTED -> SENT` rejected
- [ ] `SENT -> DISPENSED` rejected
- [ ] `DISPENSED -> CANCELLED` rejected
- [ ] Terminal states remain terminal

---

## 6. Validation

- [ ] Login request validation works
- [ ] Prescription create validation works
- [ ] Send validation works
- [ ] Dispense validation works
- [ ] Cancel validation works
- [ ] UUID param validation works
- [ ] Validation errors return clean consistent format

Recommended shape:
- [ ] `{ "error": "...", "details": [...] }`

---

## 7. Audit Logging

### Successful actions
- [ ] Create draft logged
- [ ] Sign logged
- [ ] Revert logged
- [ ] Send logged
- [ ] Receive logged
- [ ] Dispense logged
- [ ] Cancel logged
- [ ] Discard logged
- [ ] Expire logged if implemented

### Denied/failed actions
- [ ] Wrong-role access logged where intended
- [ ] Invalid lifecycle transition logged where intended
- [ ] Wrong-owner/wrong-assignment access logged where intended
- [ ] Admin raw-content access denial logged where intended

### Audit data quality
- [ ] `user_id` present where expected
- [ ] `action` values are meaningful and consistent
- [ ] `resource_type` and `resource_id` are useful
- [ ] `old_value` and `new_value` are populated where expected
- [ ] `status` reflects success/denied/failed correctly
- [ ] `ip_address` is captured where expected

---

## 8. Notifications

- [ ] Notification rows created on send
- [ ] Notification rows created on receive
- [ ] Notification rows created on dispense
- [ ] Notification rows created on cancel
- [ ] Notification stubs reference correct prescription IDs
- [ ] No notification is created for the wrong user

---

## 9. Lookup & Display Data

- [ ] Doctor patient lookup works
- [ ] Pharmacy lookup works
- [ ] Medication lookup works
- [ ] Doctor form no longer requires raw UUID entry
- [ ] Doctor tables show patient/medication/pharmacy labels
- [ ] Pharmacy tables show patient/doctor/medication labels
- [ ] Patient tables show medication/pharmacy labels
- [ ] UI no longer exposes unnecessary raw IDs in primary views

---

## 10. Frontend Role Flows

### Doctor UI
- [ ] Login works
- [ ] Doctor dashboard works
- [ ] Prescription list works
- [ ] Create draft form works
- [ ] Sign action works
- [ ] Revert action works
- [ ] Send action works
- [ ] Discard action works
- [ ] Cancel action works

### Pharmacy UI
- [ ] Login works
- [ ] Pharmacy dashboard works
- [ ] Assigned list works
- [ ] Receive action works
- [ ] Dispense action works
- [ ] Cancel action works

### Patient UI
- [ ] Login works
- [ ] Patient dashboard works
- [ ] Visible prescription list works
- [ ] Status labels are understandable

### Admin UI
- [ ] Login works
- [ ] Admin dashboard works
- [ ] Audit log list works
- [ ] Admin cannot navigate to raw prescription content by default

---

## 11. UX Cleanup

- [ ] Buttons disable during submission
- [ ] Loading states exist for major actions
- [ ] Empty states are clear
- [ ] Errors are shown clearly
- [ ] Cancel flow uses proper form/modal instead of browser prompt
- [ ] Terminal statuses are displayed clearly
- [ ] Protected-route redirects behave correctly

---

## 12. Testing

### Automated tests
- [ ] Auth tests pass
- [ ] Doctor lifecycle tests pass
- [ ] Pharmacy lifecycle tests pass
- [ ] Patient visibility tests pass
- [ ] Admin audit access tests pass
- [ ] RBAC tests pass
- [ ] Cancel/discard tests pass

### Clean-run verification
- [ ] Fresh DB → migrate → seed → test passes
- [ ] No hidden dependency on old local data
- [ ] Test results are repeatable

---

## 13. Security Review

- [ ] No plaintext passwords anywhere
- [ ] No password hashes returned in API responses
- [ ] No localStorage token persistence
- [ ] No SQL string concatenation for user input
- [ ] Parameterized queries only
- [ ] No admin overreach into patient health data
- [ ] No patient data oversharing to pharmacy
- [ ] No doctor access to unrelated prescriptions

---

## 14. Release Readiness

- [ ] `.env.example` is accurate
- [ ] README/setup instructions are current
- [ ] Seed credentials are documented only for local/dev use
- [ ] Team can run app from scratch without tribal knowledge
- [ ] Known limitations are documented
- [ ] Deferred Phase 2 items are clearly listed

---

## 15. Final Go / No-Go

Phase 1 can be called implementation-complete only if:

- [ ] all critical lifecycle paths work
- [ ] all critical RBAC rules hold
- [ ] audit coverage is acceptable
- [ ] no critical security issue remains open
- [ ] no critical data-integrity issue remains open
- [ ] no critical patient-visibility bug remains open
- [ ] no critical admin-access bug remains open

---

## Outcome

### Go
- [ ] Phase 1 implementation complete
- [ ] Ready for controlled internal review
- [ ] Ready to plan Phase 2

### No-Go
- [ ] Critical issues remain
- [ ] Must fix blockers before sign-off
