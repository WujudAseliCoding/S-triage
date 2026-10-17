import { useState } from 'react';
import { AuthContext } from './authContextValue';

// Inisialisasi pengecekan token dari localStorage
// TODO: Ambil data user dari endpoint /api/auth/me jika ada token
const readStoredUser = () => {
  try {
    const stored = localStorage.getItem('user');
    return localStorage.getItem('token') && stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

// Auth hanya untuk petugas faskes. Pasien mengakses formulir & antrean tanpa login.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  // loading tetap disediakan agar siap dipakai saat verifikasi token ke backend ditambahkan.
  return (
    <AuthContext.Provider value={{ user, login, logout, loading: false }}>
      {children}
    </AuthContext.Provider>
  );
};
