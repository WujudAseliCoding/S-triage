import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import StaffLayout from '../components/layout/StaffLayout';
import PatientLayout from '../components/layout/PatientLayout';
import NotFoundPage from '../pages/NotFoundPage';

// Halaman petugas faskes (desktop)
import LoginPage from '../pages/staff/LoginPage';
import DashboardPage from '../pages/staff/DashboardPage';
import TriageRegistrationPage from '../pages/staff/TriageRegistrationPage';
import LiveQueuePage from '../pages/staff/LiveQueuePage';
import DoctorManagementPage from '../pages/staff/DoctorManagementPage';
import ReferralPage from '../pages/staff/ReferralPage';
import AnalyticsPage from '../pages/staff/AnalyticsPage';

// Halaman pasien (mobile, tanpa login — diakses lewat QR code)
import PatientFormPage from '../pages/patient/PatientFormPage';
import PatientQueuePage from '../pages/patient/PatientQueuePage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Publik: pasien */}
      <Route element={<PatientLayout />}>
        <Route path="/formulir" element={<PatientFormPage />} />
        <Route path="/antrean" element={<PatientQueuePage />} />
      </Route>

      {/* Publik: login petugas */}
      <Route path="/login" element={<LoginPage />} />

      {/* Terproteksi: petugas faskes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<StaffLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/registrasi-triase" element={<TriageRegistrationPage />} />
          <Route path="/antrean-live" element={<LiveQueuePage />} />
          <Route path="/manajemen-dokter" element={<DoctorManagementPage />} />
          <Route path="/rujukan" element={<ReferralPage />} />
          <Route path="/laporan-analitik" element={<AnalyticsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
