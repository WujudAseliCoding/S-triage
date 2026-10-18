import api from './api';

export const getDoctors = async () => {
  const response = await api.get('/doctors');
  return response.data?.data || [];
};

export const getNurses = async () => {
  const response = await api.get('/doctors/nurses');
  return response.data?.data || [];
};

export const createDoctor = async (data) => {
  const response = await api.post('/doctors', data);
  return response.data?.data;
};

export const updateDoctor = async (id, data) => {
  const response = await api.put(`/doctors/${id}`, data);
  return response.data?.data;
};

export const updateDoctorStatus = async (id, status) => {
  const response = await api.put(`/doctors/${id}/status`, { status });
  return response.data?.data;
};

export default {
  getDoctors,
  getNurses,
  createDoctor,
  updateDoctor,
  updateDoctorStatus,
};
