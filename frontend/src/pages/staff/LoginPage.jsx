import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { z } from 'zod';
import Logo from '../../components/common/Logo';
import FormField from '../../components/common/FormField';
import PriorityBadge from '../../components/common/PriorityBadge';
import { useAuth } from '../../hooks/useAuth';
import { MOCK_STAFF_USER } from '../../data/mockData';
import { buttonPrimaryClass } from '../../utils/styles';

const loginSchema = z.object({
  email: z.string().trim().min(1, 'Isi alamat email.').email('Format email tidak valid.'),
  password: z.string().min(1, 'Isi kata sandi.'),
});

function IllustrationCard() {
  const rows = [
    { name: 'Pasien A', priority: 'merah' },
    { name: 'Pasien B', priority: 'kuning' },
    { name: 'Pasien C', priority: 'hijau' },
  ];

  return (
    <div className="rounded-3xl bg-brand-600 p-6">
      <p className="text-xs font-bold uppercase tracking-wide text-white">
        Ilustrasi pencatatan dan koordinasi layanan
      </p>
      <div className="mt-4 space-y-2.5 rounded-xl bg-brand-900/80 p-4">
        {rows.map((row) => (
          <div key={row.name} className="flex items-center justify-between rounded-lg bg-white/95 px-3 py-2.5">
            <div className="flex items-center gap-3">
              <span className="size-6 rounded-full bg-slate-200" aria-hidden="true" />
              <span className="space-y-1.5" aria-hidden="true">
                <span className="block h-2 w-24 rounded bg-slate-300" />
                <span className="block h-1.5 w-16 rounded bg-slate-200" />
              </span>
            </div>
            <PriorityBadge priority={row.priority} />
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-brand-100">Ilustrasi konsep, bukan data pasien aktual</p>
    </div>
  );
}

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [values, setValues] = useState({ email: '', password: '', remember: false });
  const [errors, setErrors] = useState({});

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = loginSchema.safeParse(values);

    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] ??= issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    // TODO: Ganti dengan authService.login(values) saat endpoint /api/auth/login tersedia.
    login({ ...MOCK_STAFF_USER, email: result.data.email }, 'mock-token');
    navigate(location.state?.from?.pathname ?? '/dashboard', { replace: true });
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-brand-800 p-16 lg:flex">
        <Logo inverted />

        <div className="space-y-6">
          <h1 className="text-4xl font-bold leading-tight tracking-tight text-white">
            Pendukung Pencatatan, Asesmen, dan Koordinasi Layanan FKTP
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-brand-100">
            Prototipe ini membantu petugas mencatat keluhan, memantau asesmen, dan mengoordinasikan
            layanan. AI belum tervalidasi klinis dan bukan pengambil keputusan medis.
          </p>
          <IllustrationCard />
        </div>

        <p className="max-w-xl text-sm leading-relaxed text-brand-200">
          © 2026 S-Triage — Prototipe pendukung pencatatan dan koordinasi layanan FKTP. Fakultas Ilmu
          Komputer, Universitas Sumatera Utara
        </p>
      </section>

      <section className="flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900 max-lg:text-left">
            Selamat Datang
          </h2>
          <p className="mt-3 text-center text-sm leading-relaxed text-slate-500 max-lg:text-left">
            Masuk sebagai petugas untuk mencatat keluhan, memantau asesmen, dan mengoordinasikan
            layanan.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-10 space-y-5">
            <FormField label="Alamat Email" htmlFor="email" error={errors.email}>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  placeholder="admin@selayangpuskesmas.go.id"
                  value={values.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  className={`block w-full rounded-lg border bg-white py-3 pl-11 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                    errors.email
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-slate-200 focus:border-brand-600 focus:ring-brand-100'
                  }`}
                />
              </div>
            </FormField>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-semibold text-slate-800">
                  Kata Sandi
                </label>
                <button type="button" className="text-xs font-semibold text-brand-700 hover:underline">
                  Lupa Sandi?
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={values.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  aria-invalid={Boolean(errors.password)}
                  className={`block w-full rounded-lg border bg-white py-3 pl-11 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                    errors.password
                      ? 'border-red-400 focus:ring-red-200'
                      : 'border-slate-200 focus:border-brand-600 focus:ring-brand-100'
                  }`}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs font-semibold text-red-600" role="alert">
                  ! {errors.password}
                </p>
              )}
            </div>

            <label className="flex items-center gap-2.5 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={values.remember}
                onChange={(e) => handleChange('remember', e.target.checked)}
                className="size-4 rounded border-slate-300 accent-brand-600"
              />
              Ingat saya (jangan di perangkat bersama)
            </label>

            <button type="submit" className={`${buttonPrimaryClass} w-full py-3.5`}>
              Masuk sebagai Petugas
            </button>
          </form>

          <p className="mt-8 text-center text-xs leading-relaxed text-slate-500">
            Hubungi IT Support Fasilkom USU jika mengalami masalah masuk. Pasien tidak perlu masuk —
            pasien mengisi formulir langsung melalui QR code dari fasilitas.
          </p>
        </div>
      </section>
    </div>
  );
}
