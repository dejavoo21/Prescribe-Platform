import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorizeRoles';
import { validateRequest } from '../../middleware/validateRequest';
import { PrescriptionsController } from './prescriptions.controller';
import {
  validateCancelPrescription,
  validateCreatePrescription,
  validateDiscardPrescription,
  validateDispensePrescription,
  validatePrescriptionIdParam,
  validateSendPrescription,
} from './prescriptions.validators';

const router = Router();

router.use(authenticate);

// doctor
router.get('/mine', authorizeRoles('doctor'), PrescriptionsController.listMine);
router.post(
  '/',
  authorizeRoles('doctor'),
  validateRequest(validateCreatePrescription),
  PrescriptionsController.create
);
router.put(
  '/:id/sign',
  authorizeRoles('doctor'),
  validateRequest(validatePrescriptionIdParam),
  PrescriptionsController.sign
);
router.put(
  '/:id/revert-to-draft',
  authorizeRoles('doctor'),
  validateRequest(validatePrescriptionIdParam),
  PrescriptionsController.revertToDraft
);
router.put(
  '/:id/send',
  authorizeRoles('doctor'),
  validateRequest(validatePrescriptionIdParam),
  validateRequest(validateSendPrescription),
  PrescriptionsController.send
);
router.put(
  '/:id/discard',
  authorizeRoles('doctor'),
  validateRequest(validateDiscardPrescription),
  PrescriptionsController.discard
);

// shared cancel
router.put(
  '/:id/cancel',
  authorizeRoles('doctor', 'pharmacy'),
  validateRequest(validatePrescriptionIdParam),
  validateRequest(validateCancelPrescription),
  PrescriptionsController.cancel
);

// pharmacy
router.get(
  '/assigned',
  authorizeRoles('pharmacy'),
  PrescriptionsController.listAssigned
);
router.put(
  '/:id/receive',
  authorizeRoles('pharmacy'),
  validateRequest(validatePrescriptionIdParam),
  PrescriptionsController.receive
);
router.put(
  '/:id/dispense',
  authorizeRoles('pharmacy'),
  validateRequest(validatePrescriptionIdParam),
  validateRequest(validateDispensePrescription),
  PrescriptionsController.dispense
);

// patient
router.get(
  '/visible',
  authorizeRoles('patient'),
  PrescriptionsController.listVisibleToPatient
);

export default router;
