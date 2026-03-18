import express from 'express';
import { authorize } from '../../middleware/authorization';
import { AuthRequest } from '../../middleware/authentication';

const router = express.Router();

/**
 * GET /api/pharmacies/:id
 * Get pharmacy profile
 */
router.get('/:id', (req: AuthRequest, res) => {
  // TODO: Get pharmacy details
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * GET /api/pharmacies
 * List pharmacies (searchable)
 */
router.get('/', (req: AuthRequest, res) => {
  // TODO: List pharmacies
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * PUT /api/pharmacies/me
 * Update own pharmacy profile
 */
router.put('/me', authorize('pharmacy'), (req: AuthRequest, res) => {
  // TODO: Update pharmacy details
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
