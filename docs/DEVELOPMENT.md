# Development Guide

## Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL 14+ (local or Docker)
- Redis (optional, for caching)
- Git

## Initial Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd prescribe-platform
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with local database URL
# DATABASE_URL=postgresql://user:password@localhost:5432/prescribe_platform_dev

# Run database migrations
npm run db:migrate

# Seed with test data (optional)
npm run db:seed

# Start development server
npm run dev
```

Backend will run on `http://localhost:3000`

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Make sure VITE_API_BASE_URL points to backend
# VITE_API_BASE_URL=http://localhost:3000/api

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

## Database Setup (PostgreSQL)

### Local PostgreSQL

**macOS (Homebrew)**
```bash
brew install postgresql
brew services start postgresql
createdb prescribe_platform_dev
```

**Windows (using Docker)**
```bash
docker run --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:14
docker exec -it postgres createdb -U postgres prescribe_platform_dev
```

**Ubuntu/Linux**
```bash
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
createdb prescribe_platform_dev
```

### Verify Connection
```bash
psql postgresql://postgres:password@localhost:5432/prescribe_platform_dev
```

## Running Locally

### Terminal 1: Backend
```bash
cd backend
npm run dev
```

Expected output:
```
Server running on port 3000
Database initialized
```

### Terminal 2: Frontend
```bash
cd frontend
npm run dev
```

Expected output:
```
  VITE v5.0.5  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

## Project Structure

```
prescribe-platform/
├── backend/
│   ├── src/
│   │   ├── config/           # Configuration files
│   │   ├── middleware/       # Express middleware
│   │   ├── modules/          # Domain-specific modules
│   │   ├── shared/           # Shared utilities and types
│   │   ├── tests/            # Test files
│   │   ├── app.ts            # Express app setup
│   │   └── index.ts          # Entry point
│   ├── migrations/           # Database migrations
│   ├── scripts/              # Utility scripts
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── auth/             # Authentication module
│   │   ├── layout/           # Layout components
│   │   ├── modules/          # Role-specific modules
│   │   ├── shared/           # Shared components, hooks, services
│   │   ├── App.tsx           # Root component
│   │   ├── main.tsx          # React entry point
│   │   └── index.css         # Global styles
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── docs/                     # Documentation
```

## Common Commands

### Backend

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run specific test file
npm run test -- auth.test.ts

# Watch mode
npm run test:watch

# Linting
npm run lint

# Fix linting issues
npm run lint:fix

# Database migrations
npm run db:migrate

# Seed test data
npm run db:seed
```

### Frontend

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Tests with UI
npm run test:ui

# Linting
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check
```

## Feature Development Workflow

### 1. Create Backend Module

For a new feature (e.g., medication search):

```bash
# Create module structure
mkdir -p backend/src/modules/medications
touch backend/src/modules/medications/medications.routes.ts
touch backend/src/modules/medications/medications.controller.ts
touch backend/src/modules/medications/medications.service.ts
touch backend/src/modules/medications/medications.queries.ts
touch backend/src/modules/medications/types.ts
```

**Pattern**: routes → controller → service → queries

### 2. Add Routes

Edit `backend/src/modules/medications/medications.routes.ts`:

```typescript
import express from 'express';
import { MedicationsController } from './medications.controller';

const router = express.Router();

router.get('/search', MedicationsController.search);
router.get('/:id', MedicationsController.getById);

export default router;
```

### 3. Add to App

In `backend/src/app.ts`:

```typescript
import medicationRoutes from './modules/medications/medications.routes';

app.use('/api/medications', medicationRoutes);
```

### 4. Implement Service Layer

```typescript
// medications.service.ts
export class MedicationsService {
  static async searchByName(query: string) {
    return await MedicationsQuery.searchByName(query);
  }
}
```

### 5. Add Database Query

```typescript
// medications.queries.ts
export class MedicationsQuery {
  static async searchByName(query: string) {
    // Query database
  }
}
```

### 6. Frontend: Create Component

```bash
mkdir -p frontend/src/modules/doctor
touch frontend/src/modules/doctor/pages/MedicationSearch.tsx
```

### 7. Hook It Up

In `frontend/src/modules/doctor/DoctorModule.tsx`:

```typescript
<Route path="/medications/search" element={<MedicationSearch />} />
```

## Testing

### Backend Unit Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test -- --coverage

# Watch mode
npm run test:watch
```

Example test:

```typescript
// src/modules/medications/medications.service.test.ts
import { MedicationsService } from './medications.service';

describe('MedicationsService', () => {
  it('should search medications by name', async () => {
    const results = await MedicationsService.searchByName('aspirin');
    expect(results.length).toBeGreaterThan(0);
  });
});
```

### Frontend Component Tests

```bash
npm run test
```

Example test:

```typescript
// src/modules/doctor/DoctorDashboard.test.tsx
import { render, screen } from '@testing-library/react';
import DoctorDashboard from './DoctorDashboard';

describe('DoctorDashboard', () => {
  it('should render dashboard', () => {
    render(<DoctorDashboard />);
    expect(screen.getByText('Doctor Dashboard')).toBeInTheDocument();
  });
});
```

## Debugging

### Backend

Use VS Code debugger or add breakpoints:

```typescript
// Add console logs
console.log('Debug info:', someVariable);

// Or use debugger statement
debugger; // Will pause if running with node --inspect
```

### Frontend

Use React DevTools and VS Code debugger:

```bash
# Run with debugging enabled
npm run dev -- --inspect
```

## Database Migrations

### Create a Migration

```bash
# Example
cat > backend/migrations/004_add_column.sql << EOF
ALTER TABLE prescriptions ADD COLUMN notes TEXT;
EOF

# Run migrations
npm run db:migrate
```

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/medication-search

# Make changes and commit
git add .
git commit -m "feat: add medication search API"

# Push and open PR
git push origin feature/medication-search
```

## Troubleshooting

### Backend Won't Start

```
Error: Database connection failed
```

Solution:
1. Verify PostgreSQL is running: `psql -U postgres`
2. Check `.env` DATABASE_URL
3. Ensure database exists: `createdb prescribe_platform_dev`

### Frontend Shows CORS Errors

```
Access to XMLHttpRequest blocked by CORS policy
```

Solution:
1. Ensure backend is running on `http://localhost:3000`
2. Check `VITE_API_BASE_URL` in `.env`
3. Check backend CORS config in `app.ts`

### Port Already in Use

```bash
# Backend (3000)
lsof -i :3000  # macOS/Linux
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess  # Windows

# Frontend (5173)
lsof -i :5173  # macOS/Linux
```

Solution: Kill process or change PORT in `.env`

## Performance Tips

1. **Database**: Add indexes for frequently queried columns
2. **Frontend**: Use React.memo for expensive components
3. **Caching**: Enable Redis for prescription queries
4. **Bundling**: Check bundle size with `npm run build -- --report`

## Next Steps

1. Implement authentication endpoints
2. Create database migrations
3. Add tests for each module
4. Connect frontend to backend APIs
5. Implement role-specific UI flows
