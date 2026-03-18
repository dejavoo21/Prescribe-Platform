import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorizeRoles';
import { LookupsController } from './lookups.controller';

const router = Router();

router.use(authenticate);

router.get(
  '/patients',
  authorizeRoles('doctor'),
  LookupsController.patients
);

router.get(
  '/pharmacies',
  authorizeRoles('doctor', 'pharmacy'),
  LookupsController.pharmacies
);

router.get(
  '/medications',
  authorizeRoles('doctor', 'pharmacy'),
  LookupsController.medications
);

export default router;
