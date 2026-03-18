import express, { Response } from 'express';
import { authorize } from '../../middleware/authorization';
import { AuthRequest } from '../../middleware/authentication';

const router = express.Router();

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me', (req: AuthRequest, res: Response) => {
  // TODO: Return authenticated user profile
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * GET /api/users/:id
 * Get user by ID (admin only)
 */
router.get('/:id', authorize('admin'), (req: AuthRequest, res: Response) => {
  // TODO: Get user details
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * PUT /api/users/:id
 * Update user profile
 */
router.put('/:id', (req: AuthRequest, res: Response) => {
  // TODO: Update user
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * GET /api/users
 * List all users (admin only)
 */
router.get('/', authorize('admin'), (req: AuthRequest, res: Response) => {
  // TODO: List users with pagination
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
