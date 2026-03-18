import express from 'express';
import { authorize } from '../../middleware/authorization';
import { AuthRequest } from '../../middleware/authentication';

const router = express.Router();

/**
 * GET /api/doctors/:id
 * Get doctor profile
 */
router.get('/:id', (req: AuthRequest, res) => {
  // TODO: Get doctor profile with specialties, schedule
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * GET /api/doctors
 * List doctors (searchable)
 */
router.get('/', (req: AuthRequest, res) => {
  // TODO: List doctors with search/filter
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * PUT /api/doctors/me
 * Update own doctor profile
 */
router.put('/me', authorize('doctor'), (req: AuthRequest, res) => {
  // TODO: Update doctor profile
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
