import {
  ChartColumn,
  FilePenLine,
  FileText,
  MapPinned,
  UserCog,
  Users,
} from 'lucide-react';

// Menu navigasi halaman petugas faskes (fitur Pengaturan Sistem tidak dibuat).
export const STAFF_NAV = [
  {
    to: '/dashboard',
    label: 'Dashboard Utama',
    title: 'Dashboard Analitik Puskesmas',
    icon: ChartColumn,
  },
  {
    to: '/registrasi-triase',
    label: 'Registrasi & Triase',
    title: 'Registrasi & Asesmen Awal Pasien',
    icon: FilePenLine,
  },
  {
    to: '/antrean-live',
    label: 'Manajemen Antrean',
    title: 'Antrean Live Puskesmas',
    icon: Users,
  },
  {
    to: '/manajemen-dokter',
    label: 'Manajemen Dokter',
    title: 'Manajemen Staf & Dokter',
    icon: UserCog,
  },
  {
    to: '/rujukan',
    label: 'Rujukan Eksternal',
    title: 'Rujukan Eksternal & Ambulans',
    icon: MapPinned,
  },
  {
    to: '/laporan-analitik',
    label: 'Laporan & Analitik',
    title: 'Laporan & Analitik S-Triage',
    icon: FileText,
  },
];
