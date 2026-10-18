import api from './api';

export const getFacilities = async () => {
  const response = await api.get('/facilities');
  return response.data?.data || [];
};

export const getReferrals = async () => {
  const response = await api.get('/referrals');
  return response.data?.data || [];
};

export const createReferral = async (data) => {
  const response = await api.post('/referrals', data);
  return response.data?.data;
};

export const updateReferralStatus = async (id, status, notes) => {
  const response = await api.put(`/referrals/status/${id}`, {
    status_rujukan: status,
    catatan_medis: notes,
  });
  return response.data?.data;
};

export const updateReferral = async (id, data) => {
  const response = await api.put(`/referrals/${id}`, data);
  return response.data?.data;
};

export default {
  getFacilities,
  getReferrals,
  createReferral,
  updateReferralStatus,
  updateReferral,
};
