import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Mail, User } from 'lucide-react';
import { z } from 'zod';
import Logo from '../../components/common/Logo';
import FormField from '../../components/common/FormField';
import PasswordInput from '../../components/common/PasswordInput';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/api';
import { buttonPrimaryClass } from '../../utils/styles';

const PASSWORD_MIN_LENGTH = 8;

const registerSchema = z
  .object({
    nama: z.string().trim().min(3, 'Nama minimal 3 karakter.'),
    email: z.string().trim().min(1, 'Isi alamat email.').email('Format email tidak valid.'),
    password: z.string().min(PASSWORD_MIN_LENGTH, `Kata sandi minimal ${PASSWORD_MIN_LENGTH} karakter.`),
    konfirmasi: z.string().min(1, 'Ulangi kata sandi.'),
  })
  .refine((data) => data.password === data.konfirmasi, {
    path: ['konfirmasi'],
    message: 'Konfirmasi kata sandi tidak sama.',
  });

const iconInputClass = (hasError) =>
  `block w-full rounded-lg border bg-white py-3 pl-11 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-red-400 focus:ring-red-200'
      : 'border-slate-200 focus:border-brand-600 focus:ring-brand-100'
  }`;

export default function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ nama: '', email: '', password: '', konfirmasi: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');

    const result = registerSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0]] ??= issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const { nama, email, password } = result.data;
    setSubmitting(true);
    try {
      await api.post('/auth/register', { nama, email, password });
      navigate('/login', { replace: true, state: { registered: true } });
    } catch (error) {
      setServerError(error.response?.data?.message ?? 'Gagal membuat akun. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xs">
        <Logo />

        <h1 className="mt-8 text-2xl font-bold tracking-tight text-slate-900">Buat Akun Petugas</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Daftarkan akun untuk mencatat keluhan, memantau asesmen, dan mengoordinasikan layanan.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
          <FormField label="Nama Lengkap" htmlFor="nama" error={errors.nama}>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-slate-400" />
              <input
                id="nama"
                type="text"
                autoComplete="name"
                placeholder="dr. Nama Lengkap"
                value={values.nama}
                onChange={(e) => handleChange('nama', e.target.value)}
                aria-invalid={Boolean(errors.nama)}
                className={iconInputClass(errors.nama)}
              />
            </div>
          </FormField>

          <FormField label="Alamat Email" htmlFor="email" error={errors.email}>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2 text-slate-400" />
              <input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="nama@selayangpuskesmas.go.id"
                value={values.email}
                onChange={(e) => handleChange('email', e.target.value)}
                aria-invalid={Boolean(errors.email)}
                className={iconInputClass(errors.email)}
              />
            </div>
          </FormField>

          <FormField
            label="Kata Sandi"
            htmlFor="password"
            hint={`Minimal ${PASSWORD_MIN_LENGTH} karakter.`}
            error={errors.password}
          >
            <PasswordInput
              id="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={values.password}
              onChange={(value) => handleChange('password', value)}
              error={errors.password}
            />
          </FormField>

          <FormField label="Ulangi Kata Sandi" htmlFor="konfirmasi" error={errors.konfirmasi}>
            <PasswordInput
              id="konfirmasi"
              autoComplete="new-password"
              placeholder="••••••••"
              value={values.konfirmasi}
              onChange={(value) => handleChange('konfirmasi', value)}
              error={errors.konfirmasi}
            />
          </FormField>

          {serverError && (
            <p className="rounded-lg bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-700" role="alert">
              {serverError}
            </p>
          )}

          <button type="submit" disabled={submitting} className={`${buttonPrimaryClass} w-full py-3.5`}>
            {submitting ? 'Memproses…' : 'Buat Akun'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-semibold text-brand-700 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}