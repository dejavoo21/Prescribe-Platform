import express from 'express';
import { AuthRequest } from '../../middleware/authentication';

const router = express.Router();

/**
 * GET /api/medications/search
 * Search medications by name
 */
router.get('/search', (req: AuthRequest, res) => {
  // TODO: Search medications by name/generic/NDC
  // Return dosage forms, strengths, interactions
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * GET /api/medications/:id
 * Get medication detail
 */
router.get('/:id', (req: AuthRequest, res) => {
  // TODO: Return full medication info
  // - Name, forms, dosages
  // - Known interactions
  // - Side effects
  // - Contraindications
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * GET /api/medications/:id/interactions
 * Check drug interactions with other medications
 */
router.get('/:id/interactions', (req: AuthRequest, res) => {
  // TODO: Check interactions between medications
  // Query param: ?with=medication_id_list
  res.status(501).json({ error: 'Not implemented' });
});

/**
 * POST /api/medications/check-safety
 * Run full medication safety check
 */
router.post('/check-safety', (req: AuthRequest, res) => {
  // TODO: Check medication against patient allergies
  // Check interactions with current medications
  // Check contraindications
  res.status(501).json({ error: 'Not implemented' });
});

export default router;
