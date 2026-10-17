import { z } from 'zod';

export const PASSWORD_MIN_LENGTH = 8;

export const registerSchema = z.object({
  nama: z.string().trim().min(3, 'Nama minimal 3 karakter'),
  email: z.string().trim().email('Format email tidak valid'),
  password: z.string().min(PASSWORD_MIN_LENGTH, `Password minimal ${PASSWORD_MIN_LENGTH} karakter`),
});

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});
