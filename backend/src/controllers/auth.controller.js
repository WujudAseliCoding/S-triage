import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

const publicUser = ({ id, nama, email, role }) => ({ id, nama, email, role });

export const register = async (req, res, next) => {
  try {
    const { nama, email, password } = req.body;
    const normalizedEmail = email.toLowerCase();

    if (await User.findOne({ where: { email: normalizedEmail } })) {
      return res.status(409).json({ status: 'error', message: 'Email sudah terdaftar.' });
    }

    const user = await User.create({
      nama,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
    });

    res.status(201).json({ status: 'success', data: { user: publicUser(user) } });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ status: 'error', message: 'Email atau kata sandi salah.' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    res.json({ status: 'success', data: { token, user: publicUser(user) } });
  } catch (error) {
    next(error);
  }
};

// JWT bersifat stateless: klien menghapus token. Endpoint ini ada agar alur logout konsisten.
export const logout = (req, res) => {
  res.json({ status: 'success', message: 'Berhasil keluar.' });
};

export const me = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ status: 'error', message: 'Pengguna tidak ditemukan.' });
    }
    res.json({ status: 'success', data: { user: publicUser(user) } });
  } catch (error) {
    next(error);
  }
};