export const errorHandler = (err, req, res, next) => {
  console.error('Unhandled Error:', err);

  const statusCode = err.statusCode || 500;
  
  if (process.env.NODE_ENV === 'production') {
    // In production, do not leak stack traces or internal details
    res.status(statusCode).json({
      error: 'Internal Server Error',
      message: statusCode === 500 ? 'Something went wrong on the server.' : err.message
    });
  } else {
    // In development, send the stack trace for easier debugging
    res.status(statusCode).json({
      error: err.message || 'Internal Server Error',
      message: err.message,
      stack: err.stack
    });
  }
};
