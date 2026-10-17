import { useState, useEffect } from 'react';
import { AuthContext } from './authContextValue';
import api from '../services/api';

// Auth hanya untuk petugas faskes. Pasien mengakses formulir & antrean tanpa login.
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    // Verifikasi token ke backend: ambil data user terkini dari /api/auth/me
    api
      .get('/auth/me')
      .then(({ data }) => {
        setUser(data.data.user);
      })
      .catch(() => {
        // Token tidak valid / expired — bersihkan sesi
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

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

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
