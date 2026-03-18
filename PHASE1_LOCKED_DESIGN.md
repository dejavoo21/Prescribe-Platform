# Prescribe Platform - Phase 1 Locked Design

**Status**: Architecture locked and ready for implementation  
**Date**: March 17, 2026  
**Team**: Ready to execute  

---

## What's Been Decided (NOT Changing)

### 1. ✅ Single Unified App (Not Separate Microservices)

```
apps/prescribe-platform/  ← ONE app
├── backend/              ← Single Express server
└── frontend/             ← Single React SPA
```

**Why**: Prescriptions are shared data. Splitting now would create sync nightmares.

### 2. ✅ Database Schema (PostgreSQL)

**Tables locked**:
- `users` (unified)
- `roles` (admin, doctor, pharmacy, patient)
- `doctors` (profiles)
- `pharmacies` (profiles)
- `patients` (profiles)
- `prescriptions` (core domain - 9-status lifecycle)
- `medications` (reference data)
- `audit_logs` (compliance)
- `notifications` (async queue)
- (See `backend/migrations/001_init_schema.sql`)

**Key decision**: Prescriptions store BOTH signed timestamps and status transitions. This allows reconstruction of who did what when.

### 3. ✅ Prescription Lifecycle (9 Statuses)

```
DRAFTED → SIGNED → SENT → RECEIVED → DISPENSING → DISPENSED → COMPLETED
   ↓
 CANCELLED (only before DISPENSING)

EXPIRED (system-driven, when valid window lapses before completion)
```

**Cancellation rule**: CANCELLED is allowed only before dispensing. After dispensing, corrections must follow a separate controlled workflow (not part of Phase 1 MVP).

**Every status change is**:
- Atomic (single transaction)
- Audited (logged with user/time/old/new)
- Notified (patient/doctor/pharmacy alerted)
- Timestamped (sent_at, received_at, dispensed_at, etc.)

### 4. ✅ Authorization Policy (Centralized)

**Four roles with clear boundaries** (see `docs/AUTHORIZATION_POLICY.md`):

| Role | Can See | Cannot See |
|------|---------|-----------|
| **Doctor** | Own prescriptions, own patients, patient allergies | Other doctors' data, pharmacy internals |
| **Pharmacy** | Assigned prescriptions, patient name/DOB/allergies (safety only) | Insurance, full medical record |
| **Patient** | Own prescriptions, own medical record | Other patients, doctor/pharmacy details |
| **Admin** | Audit logs, user list, system metrics | No default access to patient health data or prescription content. Support/investigation workflows require explicit authorization. |

**Implementation pattern**:
- Middleware checks role
- Service layer checks resource ownership
- Database WHERE clause includes user_id/role_id filters

### 5. ✅ Audit Logging (Required for Healthcare)

**Every action captured**:
```json
{
  "user_id": "...",
  "action": "prescription_submitted",
  "resource_type": "Prescription",
  "resource_id": "...",
  "old_value": { "status": "signed" },
  "new_value": { "status": "sent" },
  "ip_address": "...",
  "created_at": "2024-01-15T10:30:00Z"
}
```

**This is NOT optional. It's required for compliance.**

### 6. ✅ MVP Scope (Week 1-2)

**One happy path only**:

```
Doctor creates prescription
         ↓
Doctor submits to pharmacy
         ↓
Pharmacy receives
         ↓
Pharmacy dispenses
         ↓
Patient views "Ready for pickup"
```

**NOT in Phase 1**:
- Email/SMS sending (stubbed)
- FHIR integration (stubbed)
- Pharmacy gateway (stubbed)
- AI safety (hardcoded responses)
- Refill workflow (API stub only)
- Organization-level access
- Mobile UI

---

## Decisions Made (Cannot Change Without Review)

### Why One App, Not Split?

**Conversation Summary**:
- Single source of truth for prescriptions
- Real-time sync across roles
- Unified audit trail
- One authentication system
- Easier to scale horizontally later

### Why This Role Structure?

**Three reasons**:
1. **Real workflow**: Prescription goes doctor → pharmacy → patient
2. **Clear boundaries**: Doctor prescribes, pharmacy dispenses, patient uses
3. **Compliance**: Audit trail shows who touched what

### Why This Tech Stack?

| Layer | Choice | Reason |
|-------|--------|--------|
| Backend | Node.js + Express | Fast startup, JavaScript codebase, good for CRUD + auth |
| Language | TypeScript | Type safety, catches bugs before runtime |
| Database | PostgreSQL | ACID transactions (critical for Rx), JSON columns for flexibility |
| Auth | JWT + bcryptjs | Stateless, no session management headache |
| Frontend | React | Component reusability, role-based routing, state management |
| State | Zustand | Lightweight, simple for auth/notifications |

### Why This Folder Structure?

```
Backend:     modules/ (domain-driven)        ← Easy to extract services later
Frontend:    modules/ (role-based)           ← Clear what belongs to each role
Shared:      types/, utils/, db/            ← Single source of truth
```

---

## What's Ready Right Now

### Documentation (Complete)
- ✅ Database schema (SQL)
- ✅ Authorization policy (rules matrix)
- ✅ Prescription lifecycle (status diagram + validation rules)
- ✅ Week 1-2 implementation plan (daily breakdown)
- ✅ API examples (how to call endpoints)

### Code Scaffold (Complete)
- ✅ Folder structure (all directories created)
- ✅ TypeScript config (strict mode, path aliases)
- ✅ Express app setup (middleware wired, routes registered)
- ✅ React app setup (routing by role, protected routes)
- ✅ Environment config (example .env files)

### NOT Done Yet (But Design is Clear)
- ❌ Database migration runner
- ❌ Auth service implementation
- ❌ Prescription service implementation
- ❌ Frontend forms
- ❌ API integration tests

---

## The Critical Path (Next 2 Weeks)

### Week 1: Foundation
```
Mon: Database schema + seed script
Tue: Auth login/register endpoints
     (Staff verifies credentials work)
Wed: Frontend login connects to backend
     (Staff verifies JWT flow works)
Thu: Code review + bug fixes
Fri: All code merged, tests passing
```

### Week 2: MVP Workflow
```
Mon: Doctor creates/submits prescription
Tue: Pharmacy receives/dispenses prescription
Wed: Patient views prescription status
Thu: Audit log captures all actions
Fri: End-to-end demo working, ready for feedback
```

**Total**: 10 business days to a working prototype.

---

## Non-Negotiable Constraints

### Security
1. **No plaintext passwords** (bcryptjs, 12 rounds minimum)
2. **JWT-based authentication using secure httpOnly cookies for token storage. Do not store auth tokens in localStorage.** Access token + refresh token pattern.
3. **RBAC checked at route + service layer** (defense in depth)
4. **All mutations audited** (no dark actions)
5. **SQL parameterized queries only** (prevent injection)

### Data Integrity
1. **Prescriptions are immutable after dispensed** (unless refill)
2. **Status transitions are forward-only** (no jumping backward)
3. **Timestamps locked at creation** (created_at, sent_at, etc.)
4. **All changes logged to audit table** (for investigation)

### Healthcare Compliance
1. **Audit trail non-repudiation** (proof of who did what)
2. **Patient data access minimized** (pharmacy only sees allergies, not insurance)
3. **Doctor visibility limited** (can't see other doctors' patients)
4. **Expiration handling** (prescriptions expire after N days)
5. **Optimistic locking** (prescriptions include version field to prevent concurrent overwrites)
6. **Soft-delete only** (prescriptions and audit logs are never hard-deleted; archival/retention policy applies)
7. **Idempotent transitions** (submit, receive, dispense actions are safe to retry without creating duplicates)

---

## What Can Change (Scope Flexibility)

- ✅ UI/UX design (as long as role boundaries stay)
- ✅ Notification channels (email vs SMS vs in-app)
- ✅ Medication database (internal vs external API)
- ✅ Report formats (PDF vs JSON vs dashboard)
- ✅ Integration order (FHIR first vs pharmacy gateway first)
- ✅ Deployment target (Railway vs AWS vs Digital Ocean)

**But CANNOT change**:
- ❌ Core data model (User, Prescription, Pharmacy, Patient)
- ❌ Authorization boundaries (what each role can see)
- ❌ Prescription status transitions (must go through all steps)
- ❌ Audit logging requirement (it's healthcare law)

---

## Success Metrics (Phase 1)

By end of Week 2:

| Metric | Target | How to Measure |
|--------|--------|-----------------|
| Prescription creation | < 2 min | Time doctor from login → created Rx |
| Pharmacy receives | < 30 sec | Pharmacy sees new Rx in queue |
| Patient notification | < 5 sec | Patient app refreshes and shows status |
| Audit log | 100% | Every action logged before response sent |
| Authorization | 0 leaks | Doctor cannot see another doctor's Rx |
| Zero data loss | 100 RPC | Prescription statuses never skipped |

---

## Handoff Checklist

### For Backend Dev
- [ ] Read `PRESCRIPTION_LIFECYCLE.md` (understand statuses)
- [ ] Read `AUTHORIZATION_POLICY.md` (understand permissions)
- [ ] Read `WEEK1_WEEK2_PLAN.md` (understand tasks)
- [ ] Understand database schema (tables and relationships)
- [ ] Know when to audit log (every mutation)

### For Frontend Dev
- [ ] Read `WEEK1_WEEK2_PLAN.md` (understand what to build)
- [ ] Understand role-based routing (App.tsx shows pattern)
- [ ] Know which API endpoints exist (check auth.controller, prescriptions.controller)
- [ ] Understand authorization boundaries (don't show doctor another doctor's data)

### For QA/Product
- [ ] Read `PRESCRIPTION_LIFECYCLE.md` (test script)
- [ ] Read `AUTHORIZATION_POLICY.md` (permission test matrix)
- [ ] Know the happy path (doctor → pharmacy → patient)
- [ ] Know the edge cases (cancellation, expiration, refills)

---

## Risk Register (What Could Go Wrong)

| Risk | Impact | Mitigation |
|------|--------|-----------|
| **Auth token leak** | High | httpOnly cookies + refresh token rotation |
| **SQL injection** | High | Parameterized queries only, code review |
| **Prescription tampering** | High | Immutable after dispensed, audit log |
| **Patient data exposure** | High | Column-level access control, RBAC |
| **Audit log missing** | High | Fail-open (refuse action if audit fails) |
| **Status machine breaks** | Medium | Unit tests for all transitions |
| **Timezone bugs** | Low | All times UTC in DB, user's local on UI |
| **Duplicate prescriptions** | Low | Unique constraint on (doctor_id, patient_id, created_at minute) |

---

## Decision Log

**Decided (and why)**:

1. **One app vs three** - Easier to sync, share data, maintain.
2. **Django vs Express** - Express is what the team knows.
3. **PostgreSQL vs MongoDB** - ACID transactions are critical for Rx.
4. **JWT vs sessions** - Stateless scales better, easier for mobile later.
5. **Role-based vs group-based RBAC** - Simpler for MVP, supports groups later.
6. **Audit everything vs selective** - Healthcare law requires comprehensive trails.
7. **Hardcoded safety checks vs AI** - Hardcoded for MVP (low risk), AI for Phase 2.

---

## Communication

**Daily standup format**:
```
What did I do?
What will I do?
What's blocking me?
Any architectural questions?
```

**Design questions?**
- Update `AUTHORIZATION_POLICY.md` and commit to git
- Never deviate from schema without team agreement

**Found a bug in the design?**
- Flag it immediately
- Document in this file under "Design Changes"
- Get approval before shipping

---

## What Success Looks Like

**End of Week 2**:

```
1. Doctor logs in → creates Rx → submits to pharmacy ✅
2. Pharmacy logs in → sees queue → marks as dispensed ✅
3. Patient logs in → sees "Ready for pickup" ✅
4. Admin logs in → sees all actions in audit log ✅
5. Audit log shows every action with timestamp ✅
6. Doctor cannot see another doctor's patients ✅
7. Pharmacy cannot modify status backward ✅
8. Patient cannot see other patients' Rx ✅
9. No SQL errors, no auth bypass, no data loss ✅
10. Ready for feedback and Phase 2 planning ✅
```

---

## Questions Before Starting?

**If you don't understand something in this document, ask NOW.**

Once Week 1 starts, minimal design changes.

---

**Signed off**: Architecture Review Complete  
**Status**: ✅ LOCKED - READY TO BUILD  
**Next**: Execute Week 1-2 plan  

🚀
