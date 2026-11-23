import { AppError } from './errorMiddleware.js';

/**
 * Protects private routes using Bearer token verification via AuthService.
 */
export function createAuthMiddleware(authService) {
  return (req, _res, next) => {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      return next(new AppError('Authentication token is required', 401));
    }

    const token = header.slice('Bearer '.length).trim();
    const user = authService.verifyToken(token);
    if (!user) {
      return next(new AppError('Invalid or expired authentication token', 401));
    }

    req.user = user;
    next();
  };
}
