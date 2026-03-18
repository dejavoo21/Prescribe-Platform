import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorizeRoles';
import { AuditController } from './audit.controller';

const router = Router();

router.use(authenticate);
router.get('/', authorizeRoles('admin'), AuditController.list);

export default router;
