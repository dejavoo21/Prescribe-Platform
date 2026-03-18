import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';
import { validateRequest } from '../../middleware/validateRequest';
import { validateLogin } from './auth.validators';

const router = Router();

router.post('/login', validateRequest(validateLogin), AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', authenticate, AuthController.me);

export default router;
