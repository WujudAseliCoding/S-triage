import api from './api';

export const registerTriagePatient = async (patientData) => {
  const response = await api.post('/triage/register', patientData);
  return response.data?.data;
};

export const getTriagePatients = async () => {
  const response = await api.get('/triage/patients');
  return response.data?.data || [];
};

export const getTriagePatientById = async (id) => {
  const response = await api.get(`/triage/patients/${id}`);
  return response.data?.data;
};

// Perbarui data registrasi pasien (mode edit)
export const updateTriagePatient = async (id, patientData) => {
  const response = await api.put(`/triage/patients/${id}`, patientData);
  return response.data?.data;
};

// Hapus data registrasi pasien beserta antreannya
export const deleteTriagePatient = async (id) => {
  const response = await api.delete(`/triage/patients/${id}`);
  return response.data?.data;
};

export default {
  registerTriagePatient,
  getTriagePatients,
  getTriagePatientById,
  updateTriagePatient,
  deleteTriagePatient,
};
