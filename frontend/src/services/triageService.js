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

export default {
  registerTriagePatient,
  getTriagePatients,
  getTriagePatientById,
};
