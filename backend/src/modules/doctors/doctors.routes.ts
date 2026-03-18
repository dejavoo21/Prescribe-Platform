import express, { Response } from 'express';
import { authorize } from '../../middleware/authorization';
import { AuthRequest } from '../../middleware/authentication';

const router = express.Router();

/**
 * GET /api/doctors/:id
 * Get doctor profile
 */
router.get('/:id', (_req: AuthRequest, res: Response) => {
  // TODO: Get doctor profile with specialties, schedule
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * GET /api/doctors
 * List doctors (searchable)
 */
router.get('/', (_req: AuthRequest, res: Response) => {
  // TODO: List doctors with search/filter
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * PUT /api/doctors/me
 * Update own doctor profile
 */
router.put('/me', authorize('doctor'), (_req: AuthRequest, res: Response) => {
  // TODO: Update doctor profile
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
