import { Router } from 'express';
import { getStatus, getHealth } from '../controllers/api.controller.js';
import authRoutes from './auth.routes.js';

const router = Router();

router.get('/', getStatus);
router.get('/health', getHealth);
router.use('/auth', authRoutes);

export default router;
