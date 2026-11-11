export function notFound(req, res) {
  return res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
}

export function errorHandler(error, _req, res, _next) {
  if (error.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ success: false, message: 'Your security token expired. Refresh and try again.' });
  }

  if (error.name === 'CastError' && error.kind === 'ObjectId') {
    return res.status(400).json({ success: false, message: 'Invalid record id' });
  }

  if (error.status === 503) {
    return res.status(503).json({ success: false, message: 'Booking system is busy processing other requests. Please try again.' });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern ?? error.keyValue ?? {})[0] ?? 'field';
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      field
    });
  }

  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(({ path, message }) => ({
      field: path,
      message
    }));
    return res.status(400).json({ success: false, message: 'Validation failed', errors });
  }

  // Do not expose stack traces or internal details to API clients.
  console.error(error);
  return res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
}
