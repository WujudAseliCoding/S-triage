import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import SubmissionSuccess from '../../components/patient/SubmissionSuccess';
import QueueTicket from '../../components/patient/QueueTicket';

// Halaman antrean pasien (tanpa login). Dibuka otomatis setelah formulir terkirim.
// Tahap "menunggu verifikasi" tampil sampai petugas menerbitkan tiket;
// untuk meninjau desain tiket gunakan /antrean?tahap=tiket.
export default function PatientQueuePage() {
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const submission = state?.submission;
  const showTicket = searchParams.get('tahap') === 'tiket';

  if (!submission && !showTicket) {
    return <Navigate to="/formulir" replace />;
  }

  if (showTicket) {
    return (
      <QueueTicket
        patientName={submission?.nama ?? 'Rina Contoh'}
        referensi={submission?.referensi ?? 'SIM-2026-001'}
      />
    );
  }

  return <SubmissionSuccess submission={submission} />;
}
