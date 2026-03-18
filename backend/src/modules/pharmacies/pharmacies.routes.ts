import express, { Response } from 'express';
import { authorize } from '../../middleware/authorization';
import { AuthRequest } from '../../middleware/authentication';

const router = express.Router();

/**
 * GET /api/pharmacies/:id
 * Get pharmacy profile
 */
router.get('/:id', (_req: AuthRequest, res: Response) => {
  // TODO: Get pharmacy details
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * GET /api/pharmacies
 * List pharmacies (searchable)
 */
router.get('/', (_req: AuthRequest, res: Response) => {
  // TODO: List pharmacies
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * PUT /api/pharmacies/me
 * Update own pharmacy profile
 */
router.put('/me', authorize('pharmacy'), (_req: AuthRequest, res: Response) => {
  // TODO: Update pharmacy details
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
