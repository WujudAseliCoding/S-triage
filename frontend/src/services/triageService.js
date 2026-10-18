import api from './api';

/**
 * Triage API wrappers.
 *
 * `submitPatientIntake` is the public, login-less path used by the patient
 * form. It returns a limited payload that includes the provisional operative
 * category (so the patient's queue indicator uses the same colour as the staff
 * queue) but not the full auditable classification block.
 */
export async function submitPatientIntake(payload) {
  const { data } = await api.post('/triage/intake', payload);
  return data.data;
}

/** Staff registration: returns the full auditable classification block. */
export async function registerTriage(payload) {
  const { data } = await api.post('/triage/register', payload);
  return data.data;
}

// Alias kept for the existing staff registration callers.
export const registerTriagePatient = registerTriage;

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

/** Records the clinician's final decision separately from the AI recommendation. */
export async function verifyTriage(patientId, payload) {
  const { data } = await api.put(`/triage/patients/${patientId}/verify`, payload);
  return data.data;
}

// Hapus data registrasi pasien beserta antreannya
export const deleteTriagePatient = async (id) => {
  const response = await api.delete(`/triage/patients/${id}`);
  return response.data?.data;
};

export default {
  submitPatientIntake,
  registerTriage,
  registerTriagePatient,
  getTriagePatients,
  getTriagePatientById,
  updateTriagePatient,
  verifyTriage,
  deleteTriagePatient,
};
