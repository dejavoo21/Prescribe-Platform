# Authorization Policy & Role Boundaries — Developer Locked Version

**Status**: Locked for Phase 1 MVP  
**Purpose**: Defines the only allowed role boundaries, resource access rules, and authorization enforcement patterns for implementation.

---

## 1. Phase 1 Role Set

The platform supports these roles in Phase 1:

- `admin`
- `doctor`
- `pharmacy`
- `patient`

No additional roles are active in Phase 1.

Future roles such as `auditor`, `support`, `org_admin`, or `clinic_manager` are out of scope unless explicitly approved.

---

## 2. Core Authorization Principles

Authorization in Phase 1 follows these principles:

1. **Least privilege**
   - Every role can access only the minimum data required for its workflow.

2. **Default deny**
   - If access is not explicitly allowed, it is denied.

3. **Role + resource check**
   - Route-level role checks alone are not sufficient.
   - Every protected resource must also be checked for ownership or assignment.

4. **No implicit admin access to health data**
   - `admin` does not automatically get access to patient records or prescription content.

5. **Patient privacy is minimized by design**
   - Pharmacies and admins must not receive unnecessary patient data.

6. **All allowed and denied sensitive actions are auditable**
   - Authorization-sensitive actions must produce audit records where applicable.

---

## 3. Role Definitions

| Role | Primary Purpose | Phase 1 Scope |
|------|------------------|---------------|
| `admin` | System administration, user verification, audit review, reporting | Users, audit logs, metrics, config; no default raw patient/prescription content |
| `doctor` | Create and manage prescriptions | Own prescriptions, own patient treatment context, assigned pharmacy reference |
| `pharmacy` | Receive and dispense prescriptions | Prescriptions assigned to that pharmacy only |
| `patient` | View own prescription journey and own profile | Own prescriptions and own profile only |

---

## 4. Resource Ownership Model

Phase 1 authorization depends on explicit ownership and assignment.

### Prescription access model
- A prescription is **created by one doctor**
- A prescription is **written for one patient**
- A prescription is **assigned to one pharmacy** once sent
- A prescription may be viewed only by roles with a valid relationship to it

### Ownership terms
- Doctor: may access prescriptions where `prescriptions.doctor_id = authenticated_doctor_profile_id`
- Pharmacy: may access prescriptions where `prescriptions.pharmacy_id = authenticated_pharmacy_profile_id`
- Patient: may access prescriptions where `prescriptions.patient_id = authenticated_patient_profile_id`
- Admin: no default direct content access to prescriptions in Phase 1

### Important
"Patient owns prescriptions" is not used as a legal or data-model term in Phase 1.  
The correct rule is:

> The patient has access to prescriptions written for them.

---

## 5. Data Access Model by Role

### 5.1 Doctor

#### Doctor can:
- create prescriptions for allowed patients
- view own prescriptions in all statuses
- edit prescription content only while `DRAFTED`
- sign, send, revert, cancel where lifecycle permits
- view minimum patient clinical information required for prescribing and managing own prescriptions
- view own action history and own related audit events
- view assigned pharmacy reference for own prescriptions
- view medication reference data and safety warnings

#### Doctor cannot:
- view prescriptions created by other doctors
- access unrelated patients
- modify prescriptions after they are sent
- see full pharmacy internal workflow details beyond allowed status information
- access admin-only reports or system-wide metrics
- access patient financial/insurance data unless later explicitly approved by policy

#### Doctor patient-data scope in Phase 1:
Doctor may access only the minimum patient information required for prescribing:
- name
- date of birth
- allergies
- chronic conditions
- medication history relevant to prescribing
- other explicitly approved prescribing-related fields

Doctor does **not** get unrestricted access to "all patient data."

---

### 5.2 Pharmacy

#### Pharmacy can:
- view prescriptions explicitly assigned to that pharmacy
- receive assigned prescriptions
- dispense assigned prescriptions
- view minimum patient safety information needed for dispensing
- add dispensing notes where allowed
- view own pharmacy profile/details
- view own related audit events

#### Pharmacy cannot:
- create prescriptions
- edit clinical prescription content
- view prescriptions assigned to another pharmacy
- browse unassigned prescriptions in Phase 1
- access full patient medical record
- access patient financial or insurance data
- access doctor-only workflow details beyond what is required to dispense safely
- cancel or modify prescriptions outside lifecycle rules

#### Pharmacy patient-data scope in Phase 1:
Pharmacy may access only the minimum patient safety data required for dispensing:
- patient name
- date of birth
- allergies
- chronic conditions only where explicitly required for medication safety

Pharmacy must not access:
- insurance/member data
- unrelated medical history
- appointment history
- lab results
- unrelated diagnoses

---

### 5.3 Patient

#### Patient can:
- view own prescriptions only
- view own prescription statuses from the patient-visibility point onward
- view own profile
- update own basic profile fields allowed in UI
- view own medication history as presented by the product
- view permitted access history/audit summary about their own data, if implemented

#### Patient cannot:
- create prescriptions
- edit or delete prescriptions
- access another patient's data
- access internal doctor or pharmacy operational data
- view draft or signed-but-not-sent prescriptions
- change prescription lifecycle state directly in Phase 1

---

### 5.4 Admin

#### Admin can:
- view and manage users
- approve or reject registrations if implemented
- verify doctor and pharmacy credentials
- deactivate users
- view audit logs
- generate compliance and operational reports
- view system metrics
- manage feature/config flags if implemented

#### Admin cannot:
- create prescriptions on behalf of doctors
- modify prescription clinical content
- dispense prescriptions
- access raw patient records by default
- access raw prescription content by default
- access patient financial/insurance data by default

### Locked admin rule
In Phase 1:

> Admin has no default permission to open prescription content or patient health records.

If a future support/investigation workflow is needed, it must be implemented as a separate reviewed capability, not assumed by the base `admin` role.

---

## 6. Patient Visibility Rule

Patient visibility is locked to the prescription lifecycle.

Patient may view own prescriptions only when status is:

- `SENT`
- `RECEIVED`
- `DISPENSED`
- `CANCELLED`
- `EXPIRED`

Patient may not view prescriptions in:

- `DRAFTED`
- `SIGNED`
- `DISCARDED`

This rule must be enforced consistently in backend queries and frontend rendering.

---

## 7. Status-Based Access Summary

### Doctor
- may view own prescriptions in all active and terminal states
- may edit only in `DRAFTED`
- may perform lifecycle actions only where lifecycle rules allow

### Pharmacy
- may view only prescriptions assigned to that pharmacy
- may act only from `SENT` onward
- may not access drafts or signed-but-unsent prescriptions

### Patient
- may view only own prescriptions
- may view only from `SENT` onward

### Admin
- may view audit metadata, user/account metadata, and system metrics
- may not view raw prescription content by default

---

## 8. Locked Query Rules

The following query patterns are required.

### Rule A: Never use broad `SELECT *` for sensitive resources
Sensitive tables must use allowlisted fields.

#### Not allowed
```sql
SELECT * FROM patients WHERE id = $1;
```

#### Allowed pattern

```sql
SELECT id, user_id, first_name, last_name, date_of_birth, allergies, chronic_conditions
FROM patients
WHERE id = $1;
```

---

### Rule B: Every role query must include ownership or assignment filters

#### Doctor prescriptions

```sql
SELECT id, patient_id, pharmacy_id, medication_id, status, created_at, sent_at, dispensed_at
FROM prescriptions
WHERE doctor_id = $1;
```

#### Pharmacy prescriptions

```sql
SELECT id, patient_id, medication_id, status, sent_at, received_at, dispensed_at
FROM prescriptions
WHERE pharmacy_id = $1;
```

#### Patient prescriptions

```sql
SELECT id, doctor_id, pharmacy_id, medication_id, status, sent_at, received_at, dispensed_at
FROM prescriptions
WHERE patient_id = $1
  AND status IN ('SENT', 'RECEIVED', 'DISPENSED', 'CANCELLED', 'EXPIRED');
```

#### Admin audit logs

```sql
SELECT id, user_id, action, resource_type, resource_id, status, created_at
FROM audit_logs
WHERE created_at BETWEEN $1 AND $2
ORDER BY created_at DESC;
```

---

### Rule C: No direct patient-record reads for admin by default

#### Not allowed

```sql
SELECT id, first_name, last_name, allergies, chronic_conditions
FROM patients
WHERE id = $1;
```

for general admin workflows.

If a future exception workflow is introduced, it must be separately designed and approved.

---

## 9. Identity Mapping Rule

Authorization must not assume that all IDs are the same across `users`, `doctors`, `patients`, and `pharmacies`.

### Locked identity model

* `users.id` = platform account ID
* `doctors.id` = doctor profile ID
* `doctors.user_id` = link to user account
* `patients.id` = patient profile ID
* `patients.user_id` = link to user account
* `pharmacies.id` = pharmacy profile ID
* `pharmacies.user_id` or equivalent account linkage = link to account identity

### Implementation rule

Authorization checks must compare resource ownership against the correct profile ID, not blindly against `users.id`.

Example:

* compare `prescriptions.doctor_id` to `authenticatedUser.doctorProfileId`
* compare `prescriptions.patient_id` to `authenticatedUser.patientProfileId`
* compare `prescriptions.pharmacy_id` to `authenticatedUser.pharmacyProfileId`

---

## 10. Backend Authorization Enforcement Pattern

Authorization must be enforced in three layers:

### Layer 1: Authentication

* verify user identity
* attach authenticated user context to request

### Layer 2: Role authorization

* verify role is permitted for route

### Layer 3: Resource authorization

* verify the specific resource belongs to, or is assigned to, the authenticated actor

All three are required.

---

## 11. Route-Level Authorization Pattern

Example pattern:

```typescript
export function authorizeRoles(...allowedRoles: RoleType[]) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Role not allowed' });
    }

    next();
  };
}
```

This does **not** replace resource-level checks.

---

## 12. Service-Level Authorization Pattern

Example pattern:

```typescript
export class PrescriptionsService {
  static async getPrescriptionForRole(
    prescriptionId: string,
    actor: {
      role: 'admin' | 'doctor' | 'pharmacy' | 'patient';
      userId: string;
      doctorProfileId?: string;
      pharmacyProfileId?: string;
      patientProfileId?: string;
    }
  ) {
    const rx = await db.query(
      `SELECT id, doctor_id, pharmacy_id, patient_id, medication_id, status
       FROM prescriptions
       WHERE id = $1`,
      [prescriptionId]
    );

    if (!rx) throw new NotFoundError('Prescription not found');

    switch (actor.role) {
      case 'doctor':
        if (rx.doctor_id !== actor.doctorProfileId) {
          throw new AuthorizationError('Not your prescription');
        }
        break;

      case 'pharmacy':
        if (rx.pharmacy_id !== actor.pharmacyProfileId) {
          throw new AuthorizationError('Not assigned to your pharmacy');
        }
        break;

      case 'patient':
        if (rx.patient_id !== actor.patientProfileId) {
          throw new AuthorizationError('Not your prescription');
        }

        if (!['SENT', 'RECEIVED', 'DISPENSED', 'CANCELLED', 'EXPIRED'].includes(rx.status)) {
          throw new AuthorizationError('Prescription not visible to patient');
        }
        break;

      case 'admin':
        throw new AuthorizationError(
          'Admin has no default access to prescription content in Phase 1'
        );
    }

    return rx;
  }
}
```

---

## 13. Authorization Rules by Prescription Action

### Create prescription

* role required: `doctor`
* resource rule: patient must be within allowed prescribing scope

### Sign prescription

* role required: `doctor`
* resource rule: must be own prescription in `DRAFTED`

### Revert to draft

* role required: `doctor`
* resource rule: must be own prescription in `SIGNED`

### Send prescription

* role required: `doctor`
* resource rule: must be own prescription in `SIGNED`

### Receive prescription

* role required: `pharmacy`
* resource rule: prescription must be assigned to authenticated pharmacy and be in `SENT`

### Dispense prescription

* role required: `pharmacy`
* resource rule: prescription must be assigned to authenticated pharmacy and be in `RECEIVED`

### Cancel prescription

* role required:

  * `doctor` for own prescriptions in allowed lifecycle states
  * `pharmacy` for assigned prescriptions in allowed lifecycle states
* resource rule: must satisfy lifecycle cancellation rules

### View prescription

* `doctor`: own prescriptions only
* `pharmacy`: assigned prescriptions only
* `patient`: own prescriptions only, and only when visible by lifecycle rule
* `admin`: denied by default in Phase 1

---

## 14. Audit Requirements for Authorization

The system must audit:

* successful sensitive reads where required by policy
* all lifecycle mutations
* denied lifecycle mutation attempts
* denied access attempts to protected resources where implemented
* admin credential verification actions
* user deactivation/reactivation actions

### Minimum fields

* `user_id`
* `action`
* `resource_type`
* `resource_id`
* `status` (`success` or `denied`)
* `ip_address`
* `created_at`

---

## 15. Testing Checklist

For each role, test all of the following.

### Doctor

* can access own prescriptions
* cannot access another doctor's prescriptions
* can edit only `DRAFTED`
* cannot modify after `SENT`

### Pharmacy

* can access assigned prescriptions only
* cannot access another pharmacy's prescriptions
* cannot see drafts or signed-but-unsent prescriptions
* cannot edit clinical prescription content

### Patient

* can access own visible prescriptions only
* cannot access another patient's prescriptions
* cannot see `DRAFTED` or `SIGNED`

### Admin

* can access user management and audit logs
* cannot open prescription content by default
* cannot open patient health records by default

### Cross-role checks

* denied requests return correct error
* denied sensitive actions are logged where applicable
* field-level data exposure is minimized in responses

---

## 16. Deferred to Phase 2+

The following are not part of Phase 1 authorization:

* organization-level access boundaries
* clinic/group-based RBAC
* delegated access
* investigator break-glass workflows
* auditor-specific role
* support impersonation
* fine-grained consent workflows
* cross-organization data sharing rules
