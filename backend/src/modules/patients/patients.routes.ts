import express from 'express';
import { authorize } from '../../middleware/authorization';
import { AuthRequest } from '../../middleware/authentication';

const router = express.Router();

/**
 * GET /api/patients/:id
 * Get patient profile (doctor/pharmacy/patient can view)
 */
router.get('/:id', (req: AuthRequest, res) => {
  // TODO: Get patient profile with allergies, medical history
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * GET /api/patients/me
 * Get own patient profile
 */
router.get('/me', authorize('patient'), (req: AuthRequest, res) => {
  // TODO: Return current patient profile
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * PUT /api/patients/:id
 * Update patient profile
 */
router.put('/:id', (req: AuthRequest, res) => {
  // TODO: Update patient info, allergies
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * GET /api/patients/:id/allergies
 * Get patient allergies
 */
router.get('/:id/allergies', (req: AuthRequest, res) => {
  // TODO: Return patient allergies
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
