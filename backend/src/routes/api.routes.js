import { Router } from 'express';
import { getStatus, getHealth } from '../controllers/api.controller.js';
import authRoutes from './auth.routes.js';
import {
  registerTriagePatient,
  getTriagePatients,
  getTriagePatientById
} from '../controllers/triage.controller.js';
import {
  getLiveQueue,
  callPatient,
  startServing,
  finishServing,
  cancelQueue
} from '../controllers/queue.controller.js';
import {
  createReferral,
  getReferrals,
  getReferralById,
  updateReferralStatus
} from '../controllers/referral.controller.js';
import { getDoctors, updateDoctorStatus } from '../controllers/doctor.controller.js';
import { getFacilities } from '../controllers/facility.controller.js';
import { getDashboardStats, getAnalyticsStats } from '../controllers/dashboard.controller.js';

const router = Router();

// General status & Health
router.get('/', getStatus);
router.get('/health', getHealth);
router.use('/auth', authRoutes);

// Dashboard & Analytics
router.get('/dashboard/stats', getDashboardStats);
router.get('/analytics/stats', getAnalyticsStats);

// Doctors Management
router.get('/doctors', getDoctors);
router.put('/doctors/:id/status', updateDoctorStatus);

// External Referral Facilities
router.get('/facilities', getFacilities);

// === FOKUS B: CORE ENGINE TRIASE, INTEGRASI AI, & ANTREAN ===

// Triage Patients Routes
router.post('/triage/register', registerTriagePatient);
router.get('/triage/patients', getTriagePatients);
router.get('/triage/patients/:id', getTriagePatientById);

// Live Queue Routes
router.get('/queue/live', getLiveQueue);
router.put('/queue/call/:id', callPatient);
router.put('/queue/serve/:id', startServing);
router.put('/queue/finish/:id', finishServing);
router.put('/queue/cancel/:id', cancelQueue);

// Referrals Routes
router.post('/referrals', createReferral);
router.get('/referrals', getReferrals);
router.get('/referrals/:id', getReferralById);
router.put('/referrals/status/:id', updateReferralStatus);

export default router;
