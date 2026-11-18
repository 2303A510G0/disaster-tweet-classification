/**
 * errorHandler.js — Centralized Error Handling Middleware
 */

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    status: 'error',
    code: 'NOT_FOUND',
    message: `Not Found: ${req.method} ${req.originalUrl}`,
    detail: `Not Found: ${req.method} ${req.originalUrl}`,
  });
}

export function globalErrorHandler(err, req, res, next) {
  // Handle syntax error from malformed JSON payloads in body-parser
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      status: 'error',
      code: 'INVALID_JSON',
      message: 'Malformed JSON payload.',
      detail: 'Malformed JSON payload.',
    });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${status} - ${message}`, err.stack);
  }

  res.status(status).json({
    status: 'error',
    code: err.code || (status === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR'),
    message,
    detail: message,
  });
}
