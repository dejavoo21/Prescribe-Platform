# Prescription Lifecycle & Status Flow — Developer Locked Version

**Status**: Locked for Phase 1 MVP  
**Purpose**: Defines the only allowed prescription states, transitions, visibility rules, and API actions for implementation.

---

## 1. Phase 1 Lifecycle Scope

Phase 1 supports a single end-to-end prescription workflow:

1. Doctor creates a draft
2. Doctor signs the prescription
3. Doctor sends it to a pharmacy
4. Pharmacy receives it
5. Pharmacy dispenses it
6. Patient views the updated status
7. Audit log captures every mutation

To keep the MVP stable, **Phase 1 does not require partial dispensing, refill execution, correction workflows, or post-dispense cancellation**.

---

## 2. Locked Status Set

The platform uses these statuses in Phase 1:

- `DRAFTED`
- `SIGNED`
- `SENT`
- `RECEIVED`
- `DISPENSED`
- `CANCELLED`
- `EXPIRED`

The following statuses are **documented for future phases but not active in Phase 1 logic**:

- `DISPENSING`
- `COMPLETED`

They may exist in documentation or enums for future planning, but **must not be used in Phase 1 workflow implementation** unless explicitly approved.

---

## 3. Status Definitions

| Status | Set By | Meaning | Editable? | Patient Visible? |
|--------|--------|---------|-----------|------------------|
| `DRAFTED` | Doctor | Prescription created but not yet signed | Yes, by doctor only | No |
| `SIGNED` | Doctor | Prescription signed and ready to send | Yes, doctor may revert to draft or cancel | No |
| `SENT` | Doctor | Prescription sent to assigned pharmacy | No content edits | Yes |
| `RECEIVED` | Pharmacy | Pharmacy confirmed receipt | No content edits | Yes |
| `DISPENSED` | Pharmacy | Prescription filled and ready for pickup or delivered | No | Yes |
| `CANCELLED` | Doctor or Pharmacy | Prescription cancelled before dispensing | No | Yes |
| `EXPIRED` | System | Prescription validity window elapsed before dispensing | No | Yes, historical |

---

## 4. Patient Visibility Rule

A prescription becomes visible to the patient only when it reaches:

- `SENT`
- `RECEIVED`
- `DISPENSED`
- `CANCELLED`
- `EXPIRED`

A prescription is **not visible** to the patient in:

- `DRAFTED`
- `SIGNED`

This rule is locked for Phase 1.

---

## 5. Allowed State Transitions

These are the only valid Phase 1 transitions.

```text
DRAFTED   -> SIGNED
DRAFTED   -> DISCARDED

SIGNED    -> DRAFTED
SIGNED    -> SENT
SIGNED    -> CANCELLED

SENT      -> RECEIVED
SENT      -> CANCELLED
SENT      -> EXPIRED

RECEIVED  -> DISPENSED
RECEIVED  -> CANCELLED
RECEIVED  -> EXPIRED

DISPENSED -> terminal for Phase 1

CANCELLED -> terminal
EXPIRED   -> terminal
DISCARDED -> terminal
```

### Notes

* `DISCARDED` applies only to drafts and is not a live prescription state for patient/pharmacy workflow.
* `DISPENSED` is the final operational state for the Phase 1 MVP.
* `COMPLETED` is deferred to a later phase.
* `DISPENSING` is deferred to a later phase.

---

## 6. Forbidden Transitions

These transitions must be rejected:

* `DRAFTED -> SENT`
* `SIGNED -> DISPENSED`
* `SENT -> DISPENSED`
* `RECEIVED -> DRAFTED`
* `RECEIVED -> SIGNED`
* `DISPENSED -> CANCELLED`
* `DISPENSED -> RECEIVED`
* `CANCELLED -> any`
* `EXPIRED -> any`

If a transition is not listed in the allowed transition map, it is invalid.

---

## 7. Locked API Actions

These are the Phase 1 lifecycle actions.

### 7.1 Create Draft

**Endpoint**
`POST /api/prescriptions`

**Result**

* Creates prescription with `status = DRAFTED`

**Allowed Role**

* Doctor only

---

### 7.2 Sign Prescription

**Endpoint**
`PUT /api/prescriptions/:id/sign`

**From**

* `DRAFTED`

**To**

* `SIGNED`

**Allowed Role**

* Doctor owner only

---

### 7.3 Revert Signed to Draft

**Endpoint**
`PUT /api/prescriptions/:id/revert-to-draft`

**From**

* `SIGNED`

**To**

* `DRAFTED`

**Allowed Role**

* Doctor owner only

---

### 7.4 Send to Pharmacy

**Endpoint**
`PUT /api/prescriptions/:id/send`

**From**

* `SIGNED`

**To**

* `SENT`

**Allowed Role**

* Doctor owner only

**Required Effects**

* assign `pharmacy_id`
* set `sent_at`
* notify pharmacy
* notify patient
* write audit log

---

### 7.5 Receive by Pharmacy

**Endpoint**
`PUT /api/prescriptions/:id/receive`

**From**

* `SENT`

**To**

* `RECEIVED`

**Allowed Role**

* Assigned pharmacy only

**Required Effects**

* set `received_at`
* notify doctor
* notify patient
* write audit log

---

### 7.6 Dispense

**Endpoint**
`PUT /api/prescriptions/:id/dispense`

**From**

* `RECEIVED`

**To**

* `DISPENSED`

**Allowed Role**

* Assigned pharmacy only

**Required Effects**

* set `dispensed_at`
* store dispensing details
* notify patient
* write audit log

---

### 7.7 Cancel

**Endpoint**
`PUT /api/prescriptions/:id/cancel`

**Allowed From**

* `SIGNED`
* `SENT`
* `RECEIVED`

**To**

* `CANCELLED`

**Allowed Roles**

* Doctor owner
* Assigned pharmacy, only for `SENT` or `RECEIVED`

**Required Fields**

* `cancellation_reason_code`
* `cancellation_note` optional

**Required Effects**

* set `cancelled_at`
* set `cancelled_by_user_id`
* set `cancelled_by_role`
* notify relevant parties
* write audit log

---

### 7.8 Expire

**Trigger**

* System job or scheduled process

**Allowed From**

* `SENT`
* `RECEIVED`

**To**

* `EXPIRED`

**Required Effects**

* set `expired_at`
* write audit log
* notify patient where applicable

---

### 7.9 Discard Draft

**Endpoint**
`PUT /api/prescriptions/:id/discard`

**From**

* `DRAFTED`

**To**

* `DISCARDED`

**Allowed Role**

* Doctor owner only

**Rule**

* Draft discard is soft, audited, and never hard-deleted in Phase 1.

---

## 8. Validation Rules by Action

### Create Draft

Must validate:

* authenticated user is a doctor
* patient exists and is allowed for this doctor
* medication exists
* dosage is present and valid
* frequency is valid
* duration is valid

### Sign

Must validate:

* prescription belongs to doctor
* current status is `DRAFTED`
* required clinical fields are complete

### Send

Must validate:

* prescription belongs to doctor
* current status is `SIGNED`
* pharmacy is selected or resolved by business rule
* pharmacy exists and is active
* prescription not expired before send

### Receive

Must validate:

* current status is `SENT`
* authenticated pharmacy matches assigned `pharmacy_id`

### Dispense

Must validate:

* current status is `RECEIVED`
* authenticated pharmacy matches assigned `pharmacy_id`
* dispensed quantity is valid
* any required inventory check passes

### Cancel

Must validate:

* current status is one of allowed cancellation states
* cancelling actor is authorized
* cancellation reason code is provided

### Expire

Must validate:

* current status is expirable
* validity window has passed

---

## 9. Cancellation Rules

Cancellation is allowed only before dispensing.

### Doctor may cancel when:

* `SIGNED`
* `SENT`
* `RECEIVED`

### Pharmacy may cancel when:

* `SENT`
* `RECEIVED`

### Pharmacy may not cancel when:

* `DRAFTED`
* `SIGNED`
* `DISPENSED`

### Cancellation fields required

* `cancellation_reason_code` (required)
* `cancellation_note` (optional)
* `cancelled_by_user_id`
* `cancelled_by_role`
* `cancelled_at`

### Example cancellation reason codes

* `clinical_change`
* `duplicate_prescription`
* `patient_request`
* `out_of_stock`
* `pharmacy_rejected`
* `data_error`

---

## 10. Audit Requirements

Every mutation must produce an audit log entry in the same transaction where possible.

### Minimum audit fields

* `user_id`
* `action`
* `resource_type`
* `resource_id`
* `old_value`
* `new_value`
* `status`
* `ip_address`
* `created_at`

### Required audited actions

* create draft
* sign
* revert to draft
* send
* receive
* dispense
* cancel
* discard
* expire
* denied lifecycle mutation attempts

### Example

```json
{
  "user_id": "doctor-uuid",
  "action": "prescription_sent",
  "resource_type": "Prescription",
  "resource_id": "rx-uuid",
  "old_value": { "status": "SIGNED" },
  "new_value": { "status": "SENT", "pharmacy_id": "pharmacy-uuid" },
  "status": "success",
  "ip_address": "203.0.113.10",
  "created_at": "2026-03-17T10:30:00Z"
}
```

---

## 11. Timestamp Rules

These timestamps are locked for Phase 1:

* `created_at` when draft is created
* `signed_at` when doctor signs
* `sent_at` when doctor sends
* `received_at` when pharmacy receives
* `dispensed_at` when pharmacy dispenses
* `cancelled_at` when cancelled
* `expired_at` when expired
* `updated_at` on every mutation

These timestamps are immutable once set, except `updated_at`.

---

## 12. Data Integrity Rules

* Prescription content is editable only in `DRAFTED`
* Signed prescriptions may be reverted to `DRAFTED` only by the owning doctor
* After `SENT`, prescription clinical content is locked
* After `DISPENSED`, the prescription is immutable in Phase 1
* Prescriptions and audit logs are never hard-deleted
* All SQL must use parameterized queries
* All lifecycle transitions must check current status in the `WHERE` clause

### Example safe update

```sql
UPDATE prescriptions
SET status = 'RECEIVED',
    received_at = NOW(),
    updated_at = NOW()
WHERE id = $1
  AND pharmacy_id = $2
  AND status = 'SENT'
RETURNING *;
```

---

## 13. Concurrency Rule

To prevent accidental double transitions:

* every lifecycle mutation must validate the current status in the database update
* optional version field may be added for optimistic locking
* duplicate retries must not skip or repeat transitions silently

At minimum, the update query must fail if the current status is no longer the expected status.

---

## 14. MVP Happy Path

### Step 1

Doctor creates draft
`POST /api/prescriptions`
Result: `DRAFTED`

### Step 2

Doctor signs prescription
`PUT /api/prescriptions/:id/sign`
Result: `SIGNED`

### Step 3

Doctor sends to pharmacy
`PUT /api/prescriptions/:id/send`
Result: `SENT`

### Step 4

Pharmacy receives prescription
`PUT /api/prescriptions/:id/receive`
Result: `RECEIVED`

### Step 5

Pharmacy dispenses prescription
`PUT /api/prescriptions/:id/dispense`
Result: `DISPENSED`

### Step 6

Patient views status
`GET /api/prescriptions`
Visible statuses begin at `SENT`

---

## 15. Phase 1 Success Criteria

By end of Phase 1:

* doctor can create, sign, and send a prescription
* pharmacy can receive and dispense only assigned prescriptions
* patient can view own prescription from `SENT` onward
* no prescription can skip a locked status
* every mutation is audited
* unauthorized transition attempts are rejected
* no hard delete exists for prescriptions or audit logs

---

## 16. Deferred to Phase 2+

The following are out of scope for Phase 1:

* active `DISPENSING` state
* active `COMPLETED` state
* partial dispensing
* refill execution workflow
* correction/reversal workflow after dispense
* organization-scoped visibility
* external pharmacy gateway
* FHIR exchange
* AI-driven medication intelligence
* live SMS/email delivery beyond stubs
