import { Router } from 'express';
import { getStatus, getHealth } from '../controllers/api.controller.js';

const router = Router();

router.get('/', getStatus);
router.get('/health', getHealth);

export default router;
