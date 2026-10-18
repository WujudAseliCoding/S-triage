import api from './api';

export const registerTriagePatient = async (patientData) => {
  const response = await api.post('/triage/register', patientData);
  return response.data?.data;
};

// verifikasi: 'pending' (menunggu verifikasi) | 'done' (sudah diverifikasi) | 'all'
export const getTriagePatients = async ({ verifikasi = 'all' } = {}) => {
  const response = await api.get('/triage/patients', { params: { verifikasi } });
  return {
    patients: response.data?.data || [],
    meta: response.data?.meta || { pending: 0, done: 0 },
  };
};

export const getTriagePatientById = async (id) => {
  const response = await api.get(`/triage/patients/${id}`);
  return response.data?.data;
};

// Simpan perubahan data pasien / verifikasi oleh perawat (payload.verifikasi = true untuk verifikasi)
export const updateTriagePatient = async (id, payload) => {
  const response = await api.put(`/triage/patients/${id}`, payload);
  return response.data?.data;
};

export default {
  registerTriagePatient,
  getTriagePatients,
  getTriagePatientById,
  updateTriagePatient,
};
