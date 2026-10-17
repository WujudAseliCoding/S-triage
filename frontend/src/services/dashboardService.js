import api from './api';

export const getDashboardStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data?.data;
};

export const getAnalyticsStats = async () => {
  const response = await api.get('/analytics/stats');
  return response.data?.data;
};

export default {
  getDashboardStats,
  getAnalyticsStats,
};
