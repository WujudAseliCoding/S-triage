import api from './api';

export const getDashboardStats = async () => {
  const response = await api.get('/dashboard/stats');
  return response.data?.data;
};

export const getAnalyticsStats = async (params = {}) => {
  const response = await api.get('/analytics/stats', { params });
  return response.data?.data;
};

export const exportAnalyticsReport = async (type = 'triage') => {
  const response = await api.get('/analytics/export', {
    params: { type },
    responseType: 'blob',
  });

  let filename = `laporan_${type}_${new Date().toISOString().split('T')[0]}.csv`;
  const disposition = response.headers?.['content-disposition'];
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match?.[1]) filename = match[1];
  }

  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return true;
};

export default {
  getDashboardStats,
  getAnalyticsStats,
  exportAnalyticsReport,
};

