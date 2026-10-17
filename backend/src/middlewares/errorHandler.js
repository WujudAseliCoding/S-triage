export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: `Rute ${req.originalUrl} tidak ditemukan`,
  });
};

export const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Error:', err);
  const statusCode = err.status || 500;
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
