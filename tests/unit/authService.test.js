import { describe, it, expect, vi } from 'vitest';
import { createAuthService } from '../../src/services/authService.js';
import { hashPassword } from '../../src/utils/security.js';

describe('AuthService (with mocked userRepository)', () => {
  it('registers a new clinic staff member and returns a verifiable token', () => {
    const userRepo = {
      findByEmail: vi.fn().mockReturnValue(null),
      create: vi.fn().mockImplementation((data) => ({
        id: 1,
        ...data,
        createdAt: '2026-11-23',
      })),
      findById: vi.fn(),
    };

    const authService = createAuthService({ userRepo, tokenSecret: 'test-secret' });
    const result = authService.register({
      name: 'Nadia Karim',
      email: 'nadia@medslot.local',
      password: 'password123',
    });

    expect(userRepo.findByEmail).toHaveBeenCalledWith('nadia@medslot.local');
    expect(userRepo.create).toHaveBeenCalledOnce();
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(result.user.email).toBe('nadia@medslot.local');
    expect(authService.verifyToken(result.token)).toMatchObject({
      id: 1,
      email: 'nadia@medslot.local',
    });
  });

  it('rejects duplicate email registration with 409 conflict', () => {
    const userRepo = {
      findByEmail: vi.fn().mockReturnValue({ id: 1, email: 'admin@medslot.local' }),
      create: vi.fn(),
    };

    const authService = createAuthService({ userRepo, tokenSecret: 'test-secret' });
    expect(() =>
      authService.register({
        name: 'Duplicate',
        email: 'admin@medslot.local',
        password: 'password123',
      })
    ).toThrow(/already exists/i);
    expect(userRepo.create).not.toHaveBeenCalled();
  });

  it('logs in valid credentials and rejects wrong passwords', () => {
    const storedUser = {
      id: 7,
      name: 'Dr. Nafisa',
      email: 'admin@medslot.local',
      passwordHash: hashPassword('admin123'),
      role: 'ADMIN',
      createdAt: '2026-11-23',
    };
    const userRepo = {
      findByEmail: vi.fn().mockReturnValue(storedUser),
      findById: vi.fn().mockReturnValue(storedUser),
    };

    const authService = createAuthService({ userRepo, tokenSecret: 'test-secret' });
    const session = authService.login({ email: 'admin@medslot.local', password: 'admin123' });

    expect(session.token).toBeTruthy();
    expect(authService.getProfile(7).email).toBe('admin@medslot.local');

    expect(() =>
      authService.login({ email: 'admin@medslot.local', password: 'wrong' })
    ).toThrow(/Invalid email or password/i);
  });
});
