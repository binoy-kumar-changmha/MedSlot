/**
 * Operational application error carrying an explicit HTTP status code.
 */
export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

/**
 * Express 5 centralized error handler returning consistent JSON error payloads.
 */
export function errorMiddleware(err, _req, res, _next) {
  const statusCode = err?.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const message = statusCode >= 500 && !err?.statusCode ? 'Internal server error' : err.message;
  res.status(statusCode).json({ error: message });
}
