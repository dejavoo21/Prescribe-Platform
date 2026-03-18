# Phase 1 MVP: Week 1-2 Implementation Plan

**Goal**: Working prescription workflow end-to-end (doctor → pharmacy → patient)

---

## Week 1: Foundation

### Day 1: Database & Auth

**✅ Deliverable: Database is live and seeded with test data**

```bash
# 1. Create database
createdb prescribe_platform_dev

# 2. Run migrations
psql prescribe_platform_dev < backend/migrations/001_init_schema.sql

# 3. Verify tables exist
\dt  # in psql
```

**Create migration runner script** (`backend/scripts/migrate.ts`):

```typescript
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const migrationsDir = path.join(__dirname, '../migrations');
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

files.forEach(file => {
  console.log(`Running ${file}...`);
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
  // Execute via pg client (implement)
});

console.log('✅ Migrations complete');
```

**Create seed script** (`backend/scripts/seed-db.ts`):

```typescript
import db from '../src/shared/database/db';

async function seed() {
  // 1. Create test users
  const doctorUser = await db.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role_id, is_active)
     VALUES ($1, $2, $3, $4, (SELECT id FROM roles WHERE name='doctor'), true)
     RETURNING *`,
    ['doctor@test.com', 'hashed_password_here', 'John', 'Smith']
  );

  // 2. Create doctor profile
  await db.query(
    `INSERT INTO doctors (user_id, license_number, npi_number, clinic_name)
     VALUES ($1, $2, $3, $4)`,
    [doctorUser.id, 'CA123456', '1234567890', 'City Medical Clinic']
  );

  // 3. Create pharmacy user & profile
  const pharmacyUser = await db.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role_id)
     VALUES ($1, $2, $3, $4, (SELECT id FROM roles WHERE name='pharmacy'))
     RETURNING *`,
    ['pharmacy@test.com', 'hashed_password_here', 'CVS', 'Pharmacy']
  );

  await db.query(
    `INSERT INTO pharmacies (user_id, license_number, address, city)
     VALUES ($1, $2, $3, $4)`,
    [pharmacyUser.id, 'PHARM456', '123 Main St', 'San Francisco']
  );

  // 4. Create patient user & profile
  const patientUser = await db.query(
    `INSERT INTO users (email, password_hash, first_name, last_name, role_id)
     VALUES ($1, $2, $3, $4, (SELECT id FROM roles WHERE name='patient'))
     RETURNING *`,
    ['patient@test.com', 'hashed_password_here', 'Jane', 'Doe']
  );

  await db.query(
    `INSERT INTO patients (user_id, date_of_birth, allergies)
     VALUES ($1, $2, $3)`,
    [patientUser.id, '1990-01-15', ['{\\"Penicillin\\", \\"Shellfish\\"}']
  );

  // 5. Create sample medications
  await db.query(
    `INSERT INTO medications (name, generic_name, ndc_code, dosage_form, strength)
     VALUES 
       ($1, $2, $3, $4, $5),
       ($6, $7, $8, $9, $10)`,
    [
      'Ibuprofen', 'ibuprofen', '0069-0401-30', 'tablet', '200mg',
      'Aspirin', 'acetylsalicylic acid', '0003-0215-11', 'tablet', '325mg'
    ]
  );

  console.log('✅ Database seeded with test data');
  console.log('Test Credentials:');
  console.log('  Doctor: doctor@test.com / password');
  console.log('  Pharmacy: pharmacy@test.com / password');
  console.log('  Patient: patient@test.com / password');
}

seed().catch(console.error);
```

**Update `package.json` scripts**:

```json
{
  "scripts": {
    "db:seed": "ts-node scripts/seed-db.ts",
    "db:reset": "rm -f prescribe_platform_dev.db && npm run db:migrate && npm run db:seed"
  }
}
```

**Run it**:

```bash
cd backend
npm run db:migrate
npm run db:seed
```

---

### Day 2: Authentication Endpoints

**✅ Deliverable: Login and register working**

**Implement** `backend/src/modules/auth/auth.service.ts`:

```typescript
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../../shared/database/db';
import { config } from '../../config/environment';

export class AuthService {
  static async register(email: string, password: string, firstName: string, lastName: string, roleName: string) {
    // Check if user exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) throw new Error('Email already registered');

    // Hash password
    const passwordHash = await bcryptjs.hash(password, config.security.bcryptRounds);

    // Get role ID
    const roleResult = await db.query('SELECT id FROM roles WHERE name = $1', [roleName]);
    if (!roleResult) throw new Error('Invalid role');

    // Create user
    const user = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, first_name, last_name, role_id`,
      [email, passwordHash, firstName, lastName, roleResult.id]
    );

    return this.generateTokens(user);
  }

  static async login(email: string, password: string) {
    // Find user
    const user = await db.query(
      'SELECT u.*, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = $1',
      [email]
    );
    if (!user) throw new Error('Invalid email or password');

    // Verify password
    const isValid = await bcryptjs.compare(password, user.password_hash);
    if (!isValid) throw new Error('Invalid email or password');

    // Update last login
    await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    return this.generateTokens(user);
  }

  static generateTokens(user: any) {
    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiry }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiry }
    );

    return { user, accessToken, refreshToken };
  }

  static verify(token: string) {
    return jwt.verify(token, config.jwt.secret);
  }
}
```

**Implement** `backend/src/modules/auth/auth.controller.ts`:

```typescript
import { Request, Response } from 'express';
import { AuthService } from './auth.service';

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      const result = await AuthService.register(email, password, firstName, lastName, role);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  static async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      const user = await db.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
      const result = AuthService.generateTokens(user);
      res.json(result);
    } catch (error) {
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  }
}
```

**Update** `backend/src/modules/auth/auth.routes.ts`:

```typescript
import express from 'express';
import { AuthController } from './auth.controller';

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refresh);

export default router;
```

**Test with curl**:

```bash
# Register
curl -X POST http://localhost:9005/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@test.com","password":"testpass123","firstName":"John","lastName":"Smith","role":"doctor"}'

# Login
curl -X POST http://localhost:9005/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doctor@test.com","password":"testpass123"}'

# Response includes accessToken
```

---

### Day 3-4: Frontend Auth Integration

**✅ Deliverable: Login page connects to backend**

**Implement** `frontend/src/shared/services/api.ts`:

```typescript
import axios from 'axios';
import { useAuthStore } from '../state/authSlice';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:9005/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

**Implement** `frontend/src/auth/services/authService.ts`:

```typescript
import api from '../../shared/services/api';

export class AuthService {
  static async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  }

  static async register(email: string, password: string, firstName: string, lastName: string, role: string) {
    const response = await api.post('/auth/register', {
      email,
      password,
      firstName,
      lastName,
      role,
    });
    return response.data;
  }

  static async refresh(refreshToken: string) {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  }
}
```

**Update** `frontend/src/auth/pages/LoginPage.tsx` to actually call backend:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  try {
    const { user, accessToken } = await AuthService.login(email, password);
    setUser(user);
    setToken(accessToken);
    localStorage.setItem('token', accessToken);
    localStorage.setItem('user', JSON.stringify(user));
    navigate('/');
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Login failed');
  } finally {
    setIsLoading(false);
  }
};
```

**Test login flow**:
1. Start backend: `npm run dev`
2. Start frontend: `npm run dev`
3. Go to http://localhost:8005/login
4. Login with `doctor@test.com` / `testpass123`
5. Should redirect to `/doctor/dashboard`

---

### Day 5: Code Review

- Review database schema (normalize? missing fields?)
- Review auth flow (JWT storage, refresh tokens)
- Review type consistency (backend types match frontend types)

**Checkpoints**:
- [ ] PostgreSQL running with 001 schema
- [ ] Test users seeded
- [ ] Login API working
- [ ] Frontend login connects to backend
- [ ] Token stored in localStorage
- [ ] Dashboard route protected

---

## Week 2: Prescription Workflow

### Day 6: Doctor Creates Prescription

**✅ Deliverable: Doctor can create prescription from frontend**

**Implement** `backend/src/modules/prescriptions/prescriptions.controller.ts`:

```typescript
export class PrescriptionsController {
  static async create(req: AuthRequest, res: Response) {
    try {
      const { patientId, medicationId, dosage, frequency, duration, instructions } = req.body;
      
      // Validate doctor owns this patient relationship
      // (for MVP, doctors can prescribe any patient they know)

      const prescription = await db.query(
        `INSERT INTO prescriptions (doctor_id, patient_id, medication_id, dosage, frequency, duration, special_instructions, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'drafted')
         RETURNING *`,
        [req.user.id, patientId, medicationId, dosage, frequency, duration, instructions]
      );

      // Audit log
      await AuditService.log({
        userId: req.user.id,
        action: 'prescription_created',
        resourceType: 'Prescription',
        resourceId: prescription.id,
        newValue: prescription,
      });

      res.json(prescription);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async list(req: AuthRequest, res: Response) {
    try {
      const prescriptions = await db.query(
        'SELECT * FROM prescriptions WHERE doctor_id = $1 ORDER BY created_at DESC',
        [req.user.id]
      );
      res.json(prescriptions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const prescription = await db.query(
        'SELECT * FROM prescriptions WHERE id = $1',
        [id]
      );
      if (!prescription) return res.status(404).json({ error: 'Not found' });
      
      // Check authorization
      if (prescription.doctor_id !== req.user.id && prescription.patient_id !== req.user.id && 
          prescription.pharmacy_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      res.json(prescription);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async submit(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { pharmacyId } = req.body;

      const prescription = await db.query(
        `UPDATE prescriptions 
         SET status = 'sent', sent_at = NOW(), pharmacy_id = $1, updated_at = NOW()
         WHERE id = $2 AND doctor_id = $3 AND status = 'signed'
         RETURNING *`,
        [pharmacyId, id, req.user.id]
      );

      // Audit log
      await AuditService.log({
        userId: req.user.id,
        action: 'prescription_submitted',
        resourceType: 'Prescription',
        resourceId: id,
        oldValue: { status: 'signed' },
        newValue: { status: 'sent' },
      });

      // Notification
      await NotificationService.notifyPharmacy(pharmacyId, `New prescription ${id} received`);
      await NotificationService.notifyPatient(prescription.patient_id, `Prescription sent to pharmacy`);

      res.json(prescription);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}
```

**Update** `backend/src/modules/prescriptions/prescriptions.routes.ts` to call controller:

```typescript
router.post('/', authorize('doctor'), PrescriptionsController.create);
router.get('/', PrescriptionsController.list);
router.get('/:id', PrescriptionsController.getById);
router.put('/:id/submit', authorize('doctor'), PrescriptionsController.submit);
```

**Create frontend form** `frontend/src/modules/doctor/pages/CreatePrescription.tsx`:

```typescript
export default function CreatePrescription() {
  const [patients, setPatients] = useState([]);
  const [medications, setMedications] = useState([]);
  const [formData, setFormData] = useState({
    patientId: '',
    medicationId: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Load patients and medications
  useEffect(() => {
    api.get('/patients').then(res => setPatients(res.data));
    api.get('/medications/search').then(res => setMedications(res.data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post('/prescriptions', formData);
      navigate(`/doctor/prescriptions/${response.data.id}`);
    } catch (error) {
      console.error('Failed to create prescription', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Create Prescription</h1>

      {/* Patient select */}
      <div>
        <label className="block text-sm font-medium mb-2">Patient</label>
        <select
          value={formData.patientId}
          onChange={(e) => setFormData({...formData, patientId: e.target.value})}
          required
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="">Select patient...</option>
          {patients.map(p => (
            <option key={p.id} value={p.id}>{p.user.first_name} {p.user.last_name}</option>
          ))}
        </select>
      </div>

      {/* Medication select */}
      <div>
        <label className="block text-sm font-medium mb-2">Medication</label>
        <select
          value={formData.medicationId}
          onChange={(e) => setFormData({...formData, medicationId: e.target.value})}
          required
          className="w-full px-3 py-2 border rounded-md"
        >
          <option value="">Select medication...</option>
          {medications.map(m => (
            <option key={m.id} value={m.id}>{m.name} ({m.strength})</option>
          ))}
        </select>
      </div>

      {/* Dosage */}
      <div>
        <label className="block text-sm font-medium mb-2">Dosage</label>
        <input
          type="text"
          value={formData.dosage}
          onChange={(e) => setFormData({...formData, dosage: e.target.value})}
          placeholder="e.g., 500mg"
          required
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      {/* ... rest of form ... */}

      <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded">
        {loading ? 'Creating...' : 'Create Prescription'}
      </button>
    </form>
  );
}
```

**Add route to DoctorModule**:

```typescript
<Route path="/prescriptions/new" element={<CreatePrescription />} />
```

---

### Day 7-8: Pharmacy Receives & Dispenses

**Implement** pharmacy endpoints for receiving and dispensing:

```typescript
static async receive(req: AuthRequest, res: Response) {
  // Pharmacy marks as received
  const prescription = await db.query(
    `UPDATE prescriptions 
     SET status = 'received', received_at_pharmacy_at = NOW()
     WHERE id = $1 AND pharmacy_id = $2 AND status = 'sent'
     RETURNING *`,
    [req.params.id, req.user.id]
  );
  // ... audit log, notify ...
}

static async dispense(req: AuthRequest, res: Response) {
  // Pharmacy marks as dispensed
  const prescription = await db.query(
    `UPDATE prescriptions 
     SET status = 'dispensed', dispensed_at = NOW()
     WHERE id = $1 AND pharmacy_id = $2 AND status = 'received'
     RETURNING *`,
    [req.params.id, req.user.id]
  );
  // ... audit log, notify patient ...
}
```

**Create pharmacy UI** `frontend/src/modules/pharmacy/pages/PharmacyQueue.tsx`:

```typescript
// Show incoming prescriptions (status = 'sent')
// Click to view, receive, and dispense
```

---

### Day 9: Patient Views Status

**Implement** patient prescription list:

```typescript
// backend/src/modules/prescriptions/
// GET /api/prescriptions (for patient, show own only)
// GET /api/prescriptions/:id (patient can view their own)
```

**Create patient UI** `frontend/src/modules/patient/pages/MyPrescriptions.tsx`:

```typescript
// Show user's prescriptions with status badge
// Status translation: sent → "Pending", received → "Confirmed", dispensed → "Ready"
```

---

### Day 10: Testing & Polish

**Checkpoints**:
- [ ] Doctor creates prescription ✅
- [ ] Doctor submits to pharmacy ✅
- [ ] Pharmacy receives prescription ✅
- [ ] Pharmacy dispenses ✅
- [ ] Patient views status ✅
- [ ] Audit logs captured ✅
- [ ] Notifications sent (or logged) ✅
- [ ] No SQL injection ✅
- [ ] Authorization enforced ✅

---

## Success Criteria (End of Week 2)

```
✅ Complete end-to-end prescription workflow
✅ All status transitions working
✅ Role-based access enforced
✅ Audit log captures all actions
✅ Notifications logged (can implement email/SMS later)
✅ Zero SQL injection vulnerabilities
✅ Frontend responsive on desktop
✅ Database normalized, no data anomalies
✅ API documented in README
✅ Team can onboard and extend
```

---

## Things NOT to do in Week 1-2

- ❌ Email/SMS notifications (stub for now)
- ❌ FHIR integration (stub for now)
- ❌ Pharmacy gateway (stub for now)
- ❌ AI safety checks (return empty for now)
- ❌ Refill workflow (stub endpoint only)
- ❌ Mobile UI (desktop only)
- ❌ Load testing (do later)
- ❌ Deployment to production (local testing only)

---

## Deployment of This MVP

Once working locally, you can quickly deploy to Railway:

```bash
# Create .railwayapp.json
{
  "root": "backend",
  "envs": {
    "DATABASE_URL": "...",
    "JWT_SECRET": "..."
  }
}

# Push to Railway
git push railway main
```

But **don't do this until Phase 1 is solid locally.**

---

## File Checklist for Week 1-2

**Backend files to create/update**:
- [ ] `backend/scripts/seed-db.ts` – Test data
- [ ] `backend/src/modules/auth/auth.service.ts` – Login logic
- [ ] `backend/src/modules/auth/auth.controller.ts` – Route handlers
- [ ] `backend/src/modules/prescriptions/prescriptions.controller.ts` – CRUD
- [ ] `backend/src/modules/prescriptions/prescriptions.service.ts` – Business logic
- [ ] `backend/src/shared/database/db.ts` – Connection setup
- [ ] `backend/src/shared/services/audit.ts` – Audit logging
- [ ] `backend/src/shared/services/notification.ts` – Notification stubs

**Frontend files to create/update**:
- [ ] `frontend/src/shared/services/api.ts` – Axios instance
- [ ] `frontend/src/auth/services/authService.ts` – API calls
- [ ] `frontend/src/auth/pages/LoginPage.tsx` – Connect to backend
- [ ] `frontend/src/modules/doctor/pages/CreatePrescription.tsx` – New form
- [ ] `frontend/src/modules/pharmacy/pages/PharmacyQueue.tsx` – Receive/dispense UI
- [ ] `frontend/src/modules/patient/pages/MyPrescriptions.tsx` – Patient list

---

**This plan is achievable in 10 focused days. Start Monday, Ship Friday at 5pm. 🚀**
