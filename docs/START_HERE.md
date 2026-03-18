# Prescribe Platform — Start Here

**Current Phase**: Phase 1 MVP / Week 1 Execution  
**Team**: Backend, Frontend, QA  
**Start Date**: Monday, March 18, 2026  
**Goal**: Deliver a working prescription happy path with authentication, authorization, and audit logging.

---

## What Is This Project?

**Prescribe** is a healthcare prescription management platform allowing doctors to create and send prescriptions to pharmacies, and patients to view their prescription status.

**Phase 1 Scope**: Single end-to-end workflow (doctor → pharmacy → patient), with locked authorization and audit trail.

---

## The Three Locked Design Documents

These are the **source of truth** for Phase 1. No changes to these without architectural review.

1. **[PRESCRIPTION_LIFECYCLE.md](./PRESCRIPTION_LIFECYCLE.md)**
   - What are the allowed prescription states?
   - When can each state transition?
   - What triggers notifications?
   - What gets audited?

2. **[AUTHORIZATION_POLICY.md](./AUTHORIZATION_POLICY.md)**
   - What can each role (admin, doctor, pharmacy, patient) access?
   - How is ownership validated?
   - When is patient data visible?
   - Why is admin blocked from prescription content?

3. **[Phase 1 Database Schema](./SCHEMA.md)** *(to come)*
   - Table structure
   - Relationship model
   - Constraints and indexes

**Rule**: If it's not in these docs, it's Phase 2 or deferred.

---

## This Week's Execution Plan

**[WEEK1_EXECUTION_CHECKLIST.md](./WEEK1_EXECUTION_CHECKLIST.md)** is your day-by-day roadmap.

### Quick Summary

| Day | Owner | Deliverable |
|-----|-------|-------------|
| Monday | Backend | Database schema, migrations, seed data |
| Tuesday | Backend | Login/register endpoints, JWT auth |
| Wednesday | Backend | Role middleware, ownership checks, authorization |
| Thursday | Backend | Prescription APIs (create, sign, send, receive, dispense) |
| Friday | Frontend | Login page, doctor dashboard, forms |

### By Friday EOD

- [ ] Doctor can log in, create, sign, and send prescription
- [ ] Pharmacy can receive and dispense
- [ ] Patient can view prescription once sent
- [ ] Every action is audited
- [ ] No authorization shortcuts taken

---

## How to Get Started (Monday Morning)

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Git
- Postman (for API testing)

### 1. Clone & Setup

```bash
cd prescribe-platform
npm install
cp .env.example .env
```

Edit `.env`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/prescribe_dev
JWT_SECRET=your-secret-key
NODE_ENV=development
```

### 2. Initialize Database

```bash
npm run migrate
npm run seed
```

*(Run these commands from the `backend/` folder)*

### 3. Start Backend

```bash
npm run dev
```

Backend runs on `http://localhost:3000`

### 4. Start Frontend

```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`

### 5. Test Login

Navigate to `http://localhost:5173/login`

Use seed credentials:
- **Doctor**: `doctor1@prescribe.local` / `Demo1234!`
- **Pharmacy**: `pharmacy1@prescribe.local` / `Demo1234!`
- **Patient**: `patient1@prescribe.local` / `Demo1234!`
- **Admin**: `admin@prescribe.local` / `Demo1234!`

---

## Key Architectural Rules

### Rule 1: Authentication + Authorization Always

Every protected endpoint must have:
1. JWT validation
2. Role check
3. Ownership check
4. Status check (if applicable)

### Rule 2: Database-Level Enforcement

Authorization is not optional in application code. Lock it in SQL:

```sql
-- Doctor can only update their own prescriptions
UPDATE prescriptions
SET status = 'SIGNED'
WHERE id = $1
  AND doctor_id = $2          -- ownership check
  AND status = 'DRAFTED'      -- state check
RETURNING *;
```

### Rule 3: Patient Visibility Rule

Patients see prescriptions only when:
```sql
SELECT * FROM prescriptions
WHERE patient_id = $1
  AND status IN ('SENT', 'RECEIVED', 'DISPENSED', 'CANCELLED', 'EXPIRED');
```

This is **not optional**—enforce at query layer.

### Rule 4: Admin Has No Default Prescription Access

Admin can view **audit logs** and **user management**, but not prescription content in Phase 1.

### Rule 5: All Mutations Audit

Every create, update, delete writes to `audit_logs`:

```json
{
  "user_id": "...",
  "action": "prescription_created",
  "resource_type": "Prescription",
  "resource_id": "...",
  "old_value": null,
  "new_value": { "status": "DRAFTED", ... },
  "status": "success",
  "ip_address": "...",
  "created_at": "2026-03-18T..."
}
```

---

## File Structure

```
prescribe-platform/
├── docs/
│   ├── START_HERE.md                      ← You are here
│   ├── PRESCRIPTION_LIFECYCLE.md           ← Locked design
│   ├── AUTHORIZATION_POLICY.md             ← Locked design
│   ├── WEEK1_EXECUTION_CHECKLIST.md        ← This week's tasks
│   └── TEAM_README.md                      (coming soon)
│
├── backend/
│   ├── src/
│   │   ├── controllers/                    (API endpoints)
│   │   ├── middleware/                     (auth, authorization)
│   │   ├── services/                       (business logic)
│   │   └── db/
│   │       └── migrations/                 (SQL migration files)
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── pages/                          (Login, Dashboard, etc.)
    │   ├── components/                     (Forms, Lists, etc.)
    │   ├── hooks/                          (useAuth, etc.)
    │   └── services/                       (API client)
    ├── package.json
    └── tsconfig.json
```

---

## Daily Standups This Week

**9:00 AM**: Review checklist progress
- On track?
- Blockers?
- Ask for help early.

**4:00 PM**: Merge-readiness check
- Code reviewed?
- Tests pass?
- Ready for integration?

---

## Communication Channels

- **Blockers**: Tag lead in Slack immediately (don't wait for standup)
- **Questions on design**: Reference the 3 locked docs; don't assume
- **Changes to lifecycle/auth**: Escalate to architect before coding
- **Urgent bugs**: CEO debugging guide coming separately

---

## What Happens After Friday

### EoD Friday Demo
- Prescription created → sent → dispensed → viewed by patient
- Audit log shows every action
- Authorization test: try unauthorized access → denied + logged

### Monday Week 2
- Audit log UI (admin console)
- Pharmacy receive/dispense endpoints (if not done Fri)
- Notifications (email stubs)
- End-to-end testing

### Phase 2 (April onwards)
- Organizations/clinics
- Refill workflows
- Advanced notifications
- FHIR integration
- Mobile app

---

## FAQ

**Q: Can I add a new role in Week 1?**  
A: No. The 4 roles (admin, doctor, pharmacy, patient) are locked for Phase 1.

**Q: Do I need to implement refills?**  
A: No. Phase 2. Week 1 is the happy path only.

**Q: What about email notifications?**  
A: Stubs only in Week 1. Full implementation Week 2.

**Q: Can I change the prescription status flow?**  
A: No. The states and transitions in [PRESCRIPTION_LIFECYCLE.md](./PRESCRIPTION_LIFECYCLE.md) are locked.

**Q: What if I find a bug in the design doc?**  
A: File an issue immediately and tag the architect. Don't code around it.

**Q: Admin needs to see patient data for support. What do I do?**  
A: File an issue. That's Phase 2+. Not Phase 1.

---

## Getting Help

1. **Is it in the design docs?** → Read PRESCRIPTION_LIFECYCLE.md or AUTHORIZATION_POLICY.md
2. **Is it a tech question?** → Check WEEK1_EXECUTION_CHECKLIST.md
3. **Is it a blocker?** → Slack the team lead immediately
4. **Is it not in scope?** → It's Phase 2. Log it and move on.

---

## Success = EoD Friday

**Doctor creates → signs → sends → pharmacy receives → dispenses → patient views → audited.**

That's it. No more. No refills, no corrections, no notifications yet.

**Go.**
