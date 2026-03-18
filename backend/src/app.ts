import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from './modules/auth/auth.routes';
import prescriptionRoutes from './modules/prescriptions/prescriptions.routes';
import auditRoutes from './modules/audit/audit.routes';
import lookupsRoutes from './modules/lookups/lookups.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/lookups', lookupsRoutes);

app.use(errorHandler);

export default app;
