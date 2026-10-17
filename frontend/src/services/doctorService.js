import api from './api';

export const getDoctors = async () => {
  const response = await api.get('/doctors');
  return response.data?.data || [];
};

export const updateDoctorStatus = async (id, status) => {
  const response = await api.put(`/doctors/${id}/status`, { status });
  return response.data?.data;
};

export default {
  getDoctors,
  updateDoctorStatus,
};
