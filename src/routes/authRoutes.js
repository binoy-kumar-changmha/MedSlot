import { Router } from 'express';

export function createAuthRoutes({ authService, authMiddleware }) {
  const router = Router();

  router.post('/register', (req, res) => {
    const result = authService.register(req.body || {});
    res.status(201).json(result);
  });

  router.post('/login', (req, res) => {
    const result = authService.login(req.body || {});
    res.json(result);
  });

  router.get('/me', authMiddleware, (req, res) => {
    const user = authService.getProfile(req.user.id);
    res.json({ user });
  });

  return router;
}
