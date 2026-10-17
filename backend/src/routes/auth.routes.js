import { Router } from 'express';
import { register, login, logout, me } from '../controllers/auth.controller.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { validate } from '../middlewares/validate.js';
import { registerSchema, loginSchema } from '../schema/auth.schema.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, me);

export default router;