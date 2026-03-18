# Architecture Overview

## System Design

Prescribe Platform is designed as a **unified e-prescription system** with:
- Single backend handling all business logic
- Frontend SPA with role-based routing and components
- Shared domain models for prescriptions, medications, and users
- Role-specific workflows and UIs for doctors, pharmacies, and patients

## Architecture Principles

1. **Monolithic Backend**: Single Node.js/Express server with modular domain structure
2. **Unified Frontend**: Single React SPA with role-based routing and feature gates
3. **Centralized Authentication**: JWT-based auth with RBAC (Role-Based Access Control)
4. **Role-Specific Logic**: Business rules vary by user role but operate on shared data
5. **Audit Trail**: All mutations logged for healthcare compliance
6. **Stateless Services**: Backend designed for horizontal scaling

## Entity Relationships

```
User (core identity)
├── doctor -> Doctor (profile, specialties)
├── pharmacy -> Pharmacy (address, license)
├── patient -> Patient (medical history, allergies)
└── admin -> Admin (system access)

Prescription (core domain)
├── doctor_id -> Doctor
├── patient_id -> Patient
├── medication_id -> Medication
└── pharmacy_id -> Pharmacy (added when received)

Medication (reference data)
└── external_id (can sync with FHIR, NDC databases)

AuditLog (compliance)
├── user_id -> User
├── resource_type (Prescription, User, etc.)
└── action (create, update, status_change)
```

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Language**: TypeScript 5
- **Database**: PostgreSQL 14+
- **Cache**: Redis (optional, for performance)
- **Authentication**: JWT + bcryptjs
- **Testing**: Jest

### Frontend
- **Runtime**: Node.js 18+
- **Framework**: React 18
- **Language**: TypeScript 5
- **Bundler**: Vite 5
- **Routing**: React Router 6
- **State**: Zustand
- **HTTP**: Axios
- **Styling**: CSS + Tailwind (if added)
- **Testing**: Vitest

## Module Structure

### Backend Modules

**Core Modules** (Domain Logic)
- `auth/` - Authentication, JWT, password management
- `users/` - User profiles, role management
- `doctors/` - Provider-specific logic
- `pharmacies/` - Pharmacy-specific logic
- `patients/` - Patient profiles, medical history
- `prescriptions/` - Prescription lifecycle (core domain)
- `medications/` - Drug database, interactions
- `notifications/` - Email, SMS, in-app alerts
- `audit/` - Compliance logging
- `admin/` - System management

**Integration Modules**
- `integrations/fhir/` - FHIR export/import
- `integrations/pharmacy-gateway/` - Pharmacy system connectors
- `integrations/emr/` - EMR integration stubs

**Feature Modules**
- `safety/` - Drug interactions, contraindications, allergies

**Shared Infrastructure**
- `middleware/` - Auth, RBAC, logging, error handling
- `shared/types/` - Common TypeScript interfaces
- `shared/utils/` - Validation, encryption, date helpers
- `shared/database/` - DB connection, migrations
- `shared/security/` - RBAC definitions, permissions
- `shared/constants/` - Roles, statuses, error codes

### Frontend Modules

**Role-Based Modules**
- `modules/doctor/` - Doctor portal (create Rx, patient search, etc.)
- `modules/pharmacy/` - Pharmacy portal (received Rx queue, dispensing)
- `modules/patient/` - Patient app (my Rx, history, requests)
- `modules/admin/` - Admin dashboard (users, audit, reports)

**Shared Infrastructure**
- `auth/` - Login, registration, reset password components
- `layout/` - Main layout, navigation, header, footer
- `shared/components/` - Reusable UI (buttons, modals, tables)
- `shared/services/` - API client, auth service, data fetching
- `shared/state/` - Zustand stores (auth, notifications)
- `shared/types/` - TypeScript interfaces for frontend
- `shared/hooks/` - Custom React hooks (useApi, useAuth, etc.)
- `shared/utils/` - Helpers, formatting, validation
- `shared/constants/` - Routes, API endpoints, error messages

## Data Flow

### Prescription Creation (Doctor → Pharmacy → Patient)

1. **Doctor** fills form: patient select, medication, dosage, frequency, instructions
2. **Safety Checks**: Backend validates against patient allergies and drug interactions
3. **Create**: Prescription created in database with status `created`
4. **Submit**: Doctor submits to pharmacy (status → `submitted`)
5. **Notify**: Pharmacy notified via email/SMS
6. **Receive**: Pharmacy receives prescription (status → `received`)
7. **Dispense**: Pharmacy dispenses and registers in inventory (status → `dispensed`)
8. **Notify Patient**: Patient notified prescription is ready
9. **Patient**: Views prescription and can request refills

### Refill Workflow

1. **Patient** requests refill on active prescription
2. **Doctor** notified of refill request
3. **Doctor** approves or denies
4. **Create**: New prescription created if approved
5. Back to submission workflow

## Security

### Authentication
- JWT tokens stored in httpOnly cookies (+ localStorage fallback)
- Refresh tokens for long sessions
- Password hashing with bcryptjs (12 rounds)
- Token expiry: 24 hours (access), 7 days (refresh)

### Authorization
- Middleware-based RBAC
- Roles: `admin`, `doctor`, `pharmacy`, `patient`
- Permissions matrix in `security/permissions.ts`
- Check happens at route level and in business logic

### Encryption
- bcryptjs for passwords
- TLS/HTTPS in production
- Sensitive data (allergies, prescriptions) in encrypted columns (future)

### Compliance
- Audit logging of all mutations
- User action tracking with timestamps
- Prescription change history
- Admin access logs

## Deployment

### Backend
```bash
# Docker (recommended)
docker build -f backend/Dockerfile -t prescribe-platform:latest .
docker run -e DATABASE_URL=... -p 3000:3000 prescribe-platform

# Or Railway.app
npm install
npm run build
npm start
```

### Frontend
```bash
# Build static assets
npm run build

# Deploy to Vercel, Netlify, or CDN
# Ensure API_BASE_URL points to production backend
```

### Database
- PostgreSQL 14+ on managed service (Railway, Heroku, RDS)
- Run migrations: `npm run db:migrate`
- Seed test data: `npm run db:seed`

## Scaling Considerations

### Short Term (Current)
- Monolithic backend: sufficient for <10k daily Rx
- Single PostgreSQL instance with backups
- Optional Redis cache for frequently accessed data
- Frontend deployed as static assets on CDN

### Medium Term (10k-100k Rx/day)
- Add read replicas for PostgreSQL
- Implement caching layer (Redis)
- Separate backend instance for heavy API calls
- API rate limiting per user

### Long Term (>100k Rx/day)
- Consider extracting prescription processing to separate service
- Message queue (RabbitMQ) for async notifications
- Separate notification service
- Microservices only if team can maintain (don't split prematurely)

## Future Expansions

1. **Mobile Apps**: React Native or Flutter apps consuming same backend API
2. **FHIR Integration**: Export/import clinical data in FHIR format
3. **AI Safety**: ML model for interaction/contraindication detection
4. **Pharmacy Gateway**: Real-time sync with pharmacy inventory systems
5. **EMR Integration**: Bi-directional sync with electronic health records
6. **Analytics**: Dashboard showing prescribing patterns, compliance metrics
7. **ePay**: Integration with payment providers for prescription copays
