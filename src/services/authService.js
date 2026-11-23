import { AppError } from '../middleware/errorMiddleware.js';
import {
  hashPassword,
  verifyPassword,
  signAuthToken,
  verifyAuthToken,
} from '../utils/security.js';

function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  };
}

/**
 * Auth Module Service: handles clinic staff registration, sign-in, and token verification.
 */
export function createAuthService({ userRepo, tokenSecret }) {
  return {
    register({ name, email, password, role = 'STAFF' }) {
      const cleanName = String(name || '').trim();
      const cleanEmail = String(email || '').trim().toLowerCase();
      const rawPassword = String(password || '');

      if (!cleanName || !cleanEmail || rawPassword.length < 6) {
        throw new AppError(
          'Name, valid email, and password (min 6 characters) are required',
          400
        );
      }

      if (userRepo.findByEmail(cleanEmail)) {
        throw new AppError('An account with this email already exists', 409);
      }

      const created = userRepo.create({
        name: cleanName,
        email: cleanEmail,
        passwordHash: hashPassword(rawPassword),
        role: String(role || 'STAFF').toUpperCase(),
      });

      const user = toPublicUser(created);
      const token = signAuthToken(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        tokenSecret
      );
      return { user, token };
    },

    login({ email, password }) {
      const cleanEmail = String(email || '').trim().toLowerCase();
      const rawPassword = String(password || '');
      if (!cleanEmail || !rawPassword) {
        throw new AppError('Email and password are required', 400);
      }

      const found = userRepo.findByEmail(cleanEmail);
      if (!found || !verifyPassword(rawPassword, found.passwordHash)) {
        throw new AppError('Invalid email or password', 401);
      }

      const user = toPublicUser(found);
      const token = signAuthToken(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        tokenSecret
      );
      return { user, token };
    },

    verifyToken(token) {
      return verifyAuthToken(token, tokenSecret);
    },

    getProfile(userId) {
      const user = userRepo.findById(userId);
      if (!user) {
        throw new AppError('User account not found', 404);
      }
      return toPublicUser(user);
    },
  };
}
