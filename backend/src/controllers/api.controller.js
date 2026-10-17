export const getStatus = (req, res) => {
  res.json({
    status: 'success',
    message: 'Backend Express S-Triage aktif dan berjalan dengan baik!',
    timestamp: new Date().toISOString(),
  });
};

export const getHealth = (req, res) => {
  res.status(200).json({
    uptime: process.uptime(),
    status: 'OK',
    timestamp: Date.now(),
  });
};
