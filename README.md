# Prescribe Platform

A secure, scalable e-prescription and medication workflow platform for doctors, pharmacies, and patients.

## Overview

Prescribe Platform is designed as a unified system with:
- **Centralized backend** with modular domain logic
- **Single frontend SPA** with role-based routing
- **Healthcare-grade security** (RBAC, audit logging, encryption)
- **FHIR-ready** integration framework
- **Medication safety** checks (interactions, contraindications)

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis (optional, for caching)

### Setup

1. **Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   npm run db:migrate
   npm run dev
   ```

2. **Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm run dev
   ```

## Project Structure

```
prescribe-platform/
├── backend/          # Express.js + TypeScript backend
├── frontend/         # React + TypeScript frontend
└── docs/            # Architecture and deployment docs
```

## Key Features

### Phase 1: Foundation
- User authentication & RBAC
- Basic prescription creation
- Role-based access control

### Phase 2: Core Workflow
- Doctor creates prescriptions
- Pharmacy processes and dispenses
- Patient views status

### Phase 3: Patient Features
- Patient dashboard & history
- Prescription refill requests
- Allergy & medication tracking

### Phase 4: Safety & Intelligence
- Drug interaction checking
- FHIR integration
- Pharmacy gateway connectors
- Audit reporting

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API.md)
- [Database Schema](docs/DATABASE_SCHEMA.md)
- [Development Guide](docs/DEVELOPMENT.md)
- [Security](docs/SECURITY.md)
- [Deployment](docs/DEPLOYMENT.md)

## Development

### Backend Commands
```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build for production
npm test             # Run tests
npm run lint         # Linting
npm run db:migrate   # Run migrations
npm run db:seed      # Seed test data
```

### Frontend Commands
```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
npm run lint         # Linting
```

## Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for Railway, Docker, and cloud deployment instructions.

## License

Proprietary - Healthcare Production System
