import { Router } from 'express';
import { getStatus, getHealth } from '../controllers/api.controller.js';
import authRoutes from './auth.routes.js';
import {
  registerTriagePatient,
  patientIntake,
  getTriagePatients,
  getTriagePatientById,
  verifyTriagePatient,
  updateTriagePatient,
  deleteTriagePatient
} from '../controllers/triage.controller.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import {
  getLiveQueue,
  callPatient,
  startServing,
  finishServing,
  cancelQueue,
  escalateQueue,
  recordAction,
  deleteQueue
} from '../controllers/queue.controller.js';
import {
  createReferral,
  getReferrals,
  getReferralById,
  updateReferralStatus,
  updateReferral
} from '../controllers/referral.controller.js';
import {
  getDoctors,
  getNurses,
  createDoctor,
  updateDoctor,
  updateDoctorStatus
} from '../controllers/doctor.controller.js';
import { getFacilities } from '../controllers/facility.controller.js';
import {
  getDashboardStats,
  getAnalyticsStats,
  exportAnalytics,
} from '../controllers/dashboard.controller.js';

const router = Router();

// General status & Health
router.get('/', getStatus);
router.get('/health', getHealth);
router.use('/auth', authRoutes);

// Dashboard & Analytics
router.get('/dashboard/stats', getDashboardStats);
router.get('/analytics/stats', getAnalyticsStats);
router.get('/analytics/export', exportAnalytics);

// Doctors & Staff Management
router.get('/doctors', getDoctors);
router.get('/doctors/nurses', getNurses);
router.post('/doctors', createDoctor);
router.put('/doctors/:id', updateDoctor);
router.put('/doctors/:id/status', updateDoctorStatus);

// External Referral Facilities
router.get('/facilities', getFacilities);

// === FOKUS B: CORE ENGINE TRIASE, INTEGRASI AI, & ANTREAN ===

// Triage Patients Routes
// Pendaftaran bersifat publik (pasien mengisi formulir via QR); data pasien hanya untuk petugas login.
router.post('/triage/register', registerTriagePatient);
router.post('/triage/intake', patientIntake);
router.get('/triage/patients', verifyToken, getTriagePatients);
router.get('/triage/patients/:id', verifyToken, getTriagePatientById);
router.put('/triage/patients/:id', verifyToken, updateTriagePatient);
router.put('/triage/patients/:id/verify', verifyToken, verifyTriagePatient);
router.delete('/triage/patients/:id', verifyToken, deleteTriagePatient);

// Live Queue Routes
router.get('/queue/live', getLiveQueue);
router.put('/queue/call/:id', callPatient);
router.put('/queue/serve/:id', startServing);
router.put('/queue/finish/:id', finishServing);
router.put('/queue/cancel/:id', cancelQueue);
router.put('/queue/escalate/:id', escalateQueue);
router.put('/queue/action/:id', recordAction);
router.delete('/queue/:id', deleteQueue);

// Referrals Routes
router.post('/referrals', createReferral);
router.get('/referrals', getReferrals);
router.get('/referrals/:id', getReferralById);
router.put('/referrals/status/:id', updateReferralStatus);
router.put('/referrals/:id', updateReferral);

export default router;
