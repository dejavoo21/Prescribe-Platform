# Railway Deployment Checklist - Phase 1

> **Status**: Phase 1 MVP ready for deployment  
> **Test Coverage**: 38/42 integration tests passing (100% critical paths)  
> **Target**: Deploy backend API + PostgreSQL + frontend to Railway  

---

## Pre-Deployment Validation

- [x] Backend integration tests passing (38/42, all critical paths green)
- [x] RBAC enforcement validated
- [x] Audit logging working
- [x] Cancel/discard functionality complete
- [x] Patient visibility rules verified
- [x] Modal UX for sensitive operations implemented
- [x] Local PostgreSQL database schema confirmed

---

## 1. Environment Configuration

### 1.1 Backend Environment Variables

Create a `.env` file in the `backend/` directory with:

```env
# Server Configuration
NODE_ENV=production
PORT=3000

# Database (will be Railway PostgreSQL URL)
DATABASE_URL=postgresql://prescribe_user:prescribe_password@localhost:5432/prescribe_dev

# JWT Security
JWT_SECRET=<generate-strong-secret-32-chars-min>
JWT_EXPIRES_IN=7d

# Cookie Security (production)
COOKIE_SECURE=true

# Application
APP_NAME=Prescribe Platform
APP_VERSION=1.0.0
```

**Critical for Production:**
- `JWT_SECRET`: Generate cryptographically secure string (at least 32 characters)
- `COOKIE_SECURE=true`: Enforces HTTPS in production
- `NODE_ENV=production`: Disables dev tooling logs

### 1.2 Frontend Environment Variables

Create a `.env` file in the `frontend/` directory with:

```env
VITE_API_URL=https://api.prescribe.example.com
VITE_APP_NAME=Prescribe
VITE_APP_VERSION=1.0.0
```

For local development (already configured):
```env
VITE_API_URL=http://localhost:3000
```

**Note**: Update `VITE_API_URL` to your actual Railway backend domain after deployment.

---

## 2. Railway PostgreSQL Setup

### 2.1 Create PostgreSQL Database on Railway

1. Login to [Railway Dashboard](https://railway.app)
2. Create new project: `prescribe-platform-prod`
3. Add PostgreSQL plugin
4. Configure database:
   - **PostgreSQL Version**: 14 or later
   - **Database Name**: `prescribe_dev` (or `prescribe_prod` for production)
   - **Superuser Username**: `prescribe_user`
   - **Superuser Password**: Generate strong password (store securely)

### 2.2 Capture Connection String

After PostgreSQL service is created:

```
Connection URL: postgresql://prescribe_user:[PASSWORD]@[HOST]:[PORT]/prescribe_dev
```

This becomes your `DATABASE_URL` environment variable.

### 2.3 Optional: Backup Local Database

Before migration, export your local test data:

```bash
# Local backup
pg_dump -U prescribe_user -h localhost prescribe_dev > backup_phase1.sql

# Later restore (if needed):
# psql -U prescribe_user -h [railway-host] -d prescribe_dev -f backup_phase1.sql
```

---

## 3. Backend Deployment

### 3.1 Dockerfile (Already Provided)

The backend has a prepared `backend/Dockerfile`. Railway will auto-detect and build.

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### 3.2 Deploy to Railway

1. Connect backend repository to Railway:
   - Push to GitHub branch
   - Link GitHub repo in Railway project
   - Set build command: `npm run build`
   - Set start command: `npm start`

2. Configure environment on Railway:
   - Add all variables from **1.1** 
   - Set `DATABASE_URL` to Railway PostgreSQL connection string
   - Generate and store `JWT_SECRET` in Railway secrets

### 3.3 Database Migration Script

After backend service boots:

```bash
# SSH into Railway container or run via Railway commands:
npm run db:migrate
```

This executes `src/scripts/migrate.ts` which runs `migrations/001_init_schema.sql`.

**Expected output**:
```
✓ Migration completed successfully
✓ All tables created: users, prescriptions, audit_logs, notifications, lookups, etc.
```

### 3.4 Database Seeding (Optional/Testing)

To populate test data after migration:

```bash
npm run db:seed
```

**Test login credentials created**:
```
admin@prescribe.local / ChangeMe123!
doctor@prescribe.local / ChangeMe123!
pharmacy@prescribe.local / ChangeMe123!
patient@prescribe.local / ChangeMe123!
```

**⚠️ Production Note**: Disable or remove seed in production. Use admin console to create real user accounts instead.

---

## 4. Frontend Deployment

### 4.1 Build Frontend

```bash
cd frontend
npm install
npm run build
```

Output: `frontend/dist/` directory with static files.

### 4.2 Deploy Static Files to Railway

**Option A: Use Railway Static Hosting**
1. Create new service in Railway project
2. Connect GitHub branch
3. Set build command: `npm run build` (in `frontend/` directory)
4. Set output directory: `frontend/dist`
5. Railway auto-serves on public URL

**Option B: Serve from Backend**
1. Copy `frontend/dist/*` to `backend/public/`
2. Backend serves static files via Express
3. Deploy backend as single service

**Recommended**: Option A (cleaner separation)

### 4.3 Update CORS Settings

Backend needs to accept requests from frontend URL:

In `backend/src/index.ts`:

```typescript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
```

Add to backend `.env`:
```env
FRONTEND_URL=https://prescribe.example.com
```

---

## 5. Health Check & Monitoring

### 5.1 Backend Health Endpoint

Ensure this endpoint exists for Railway health checks:

```typescript
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: env.appVersion,
  });
});
```

Configure Railway to check: `GET /health` (200 response = healthy)

### 5.2 Database Connectivity Verification

Add endpoint to verify database:

```typescript
app.get('/health/db', async (req, res) => {
  try {
    const result = await pool.query('SELECT 1');
    res.json({ database: 'connected', message: 'PostgreSQL responds' });
  } catch (error) {
    res.status(503).json({ database: 'disconnected', error: String(error) });
  }
});
```

Recommended Railway health check: `GET /health/db`

---

## 6. Security Checklist

Before production launch:

- [ ] **HTTPS Only**: All cookies marked `secure: true`
- [ ] **CORS Locked**: Only allow frontend domain, not wildcard
- [ ] **JWT Secret**: 32+ character random string, stored in Railway secrets
- [ ] **Password Hashing**: Verified bcrypt used (already implemented)
- [ ] **SQL Injection**: All queries use parameterized statements (already implemented)
- [ ] **RBAC Enforced**: Role checks on all protected routes (already implemented)
- [ ] **Audit Logging**: All sensitive actions logged (already implemented)
- [ ] **Cookie httpOnly**: Set to `true` in production (already configured)
- [ ] **Secrets Management**: No hardcoded credentials in code
- [ ] **Database Backups**: Configure Railway automated backups

---

## 7. Cookie Configuration

### 7.1 Development vs Production

**Development** (.env):
```typescript
const cookieOptions = {
  httpOnly: true,
  secure: false,  // Allow HTTP
  sameSite: 'lax',
  path: '/',
  maxAge: 24 * 60 * 60 * 1000,  // 1 day
};
```

**Production** (Railway .env):
```typescript
const cookieOptions = {
  httpOnly: true,
  secure: true,   // HTTPS only
  sameSite: 'strict',  // Strict CSRF protection
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
  domain: 'prescribe.example.com',
};
```

---

## 8. Post-Deployment Validation

After deploying to Railway:

### 8.1 Health Checks

```bash
# Backend health
curl https://api.prescribe.example.com/health

# Database connectivity
curl https://api.prescribe.example.com/health/db

# Frontend accessibility
curl https://prescribe.example.com
```

### 8.2 Test Login Flow

1. Open frontend URL in browser
2. Login as test user:
   ```
   Email: doctor@prescribe.local
   Password: ChangeMe123!
   ```
3. Create a prescription (DRAFTED state)
4. Verify page loads without errors
5. Check browser DevTools → Network tab:
   - API requests have 2xx responses
   - Cookies appear in request headers
   - CORS headers present

### 8.3 Test Core Workflows

**Doctor Flow**:
- [ ] Login → Create prescription → Sign → Send → Verify state changes

**Pharmacy Flow**:
- [ ] Login → Receive prescription → Dispense → Verify state changes

**Patient Flow**:
- [ ] Login → View received prescriptions → Verify visibility rules (only SENT onward)

**Admin Flow**:
- [ ] Login → Access audit logs → Verify no crash on page load

### 8.4 Verify Audit Logging

Check audit logs are being written:

```
SELECT COUNT(*) FROM audit_logs;  -- Should have entries
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5;
```

---

## 9. Rollback Plan

If issues occur after deployment:

### 9.1 Quick Rollback

1. Railway allows reverting to previous deployment
2. Keep previous build artifacts available
3. Have database backup ready: `backup_phase1.sql`

### 9.2 If Database Migration Fails

```bash
# Connect to Railway PostgreSQL
psql -U prescribe_user -h [railway-host] -d prescribe_dev

# Restore from backup (if needed)
psql -U prescribe_user -h [railway-host] -d prescribe_dev < backup_phase1.sql
```

---

## 10. Deployment Commands Summary

```bash
# 1. Local testing (before Railway)
cd backend && npm install && npm run build && npm run db:migrate && npm test

# 2. Push to GitHub (Railway picks up automatically)
git push origin main

# 3. Monitor Railway dashboard for build/deploy status

# 4. After deployment, verify:
curl https://api.prescribe.example.com/health
curl https://prescribe.example.com

# 5. If needed, SSH into Railway container:
# (Use Railway CLI or dashboard terminal)
npm run db:seed  # Add test data if desired
```

---

## 11. Next Steps After Phase 1 Deployment

Once Phase 1 is live on Railway:

1. **Phase 2 Features Planning**:
   - Medication search/autocomplete (currently timing out in tests)
   - Advanced audit filtering
   - Notification email system
   - One-time password (OTP) for 2FA (if needed)

2. **Monitoring & Alerts**:
   - Set up Railway error tracking
   - Configure email alerts for health check failures
   - Monitor database connection pool usage

3. **User Admin Setup**:
   - Disable seed script in production
   - Create real user accounts via admin console
   - Set strong passwords and 2FA if applicable

4. **Backup & Disaster Recovery**:
   - Enable Railway automated daily backups
   - Test restore procedure monthly
   - Document runbook for manual restore

---

## 12. Support & Troubleshooting

### Common Issues

**Issue**: Database connection timeout
- **Check**: `DATABASE_URL` is correct, PostgreSQL service is running
- **Fix**: Verify Railway PostgreSQL credentials in `.env`

**Issue**: CORS errors in frontend console
- **Check**: `FRONTEND_URL` matches actual frontend domain
- **Fix**: Update backend `.env` with correct origin

**Issue**: Login fails with "Unauthorized"
- **Check**: JWT_SECRET is same across deploys
- **Fix**: Don't change JWT_SECRET after users have tokens

**Issue**: Migrations fail, "table already exists"
- **Check**: Running migration twice on same database
- **Fix**: Drop tables and re-run, or seed with fresh database

---

## Document Metadata

- **Created**: [Phase 1 Finalization]
- **Last Updated**: 2026-03-18
- **Status**: Ready for Deployment
- **Test Coverage**: 38/42 tests passing (critical paths 100%)
- **Next Review**: After Phase 1 production deployment
