import api from './api';

export const getLiveQueue = async () => {
  const response = await api.get('/queue/live');
  return response.data?.data || [];
};

export const callPatient = async (id, doctorId) => {
  const response = await api.put(`/queue/call/${id}`, { dokter_id: doctorId });
  return response.data?.data;
};

export const startServing = async (id) => {
  const response = await api.put(`/queue/serve/${id}`);
  return response.data?.data;
};

export const finishServing = async (id) => {
  const response = await api.put(`/queue/finish/${id}`);
  return response.data?.data;
};

export const cancelQueue = async (id) => {
  const response = await api.put(`/queue/cancel/${id}`);
  return response.data?.data;
};

export default {
  getLiveQueue,
  callPatient,
  startServing,
  finishServing,
  cancelQueue,
};
