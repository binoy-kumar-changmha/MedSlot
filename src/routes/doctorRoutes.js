import { Router } from 'express';

export function createDoctorRoutes({ doctorService, authMiddleware }) {
  const router = Router();
  router.use(authMiddleware);

  router.get('/', (req, res) => {
    const doctors = doctorService.listDoctors(req.query.specialty || '');
    res.json({ doctors });
  });

  router.post('/', (req, res) => {
    const doctor = doctorService.createDoctor(req.body || {});
    res.status(201).json({ doctor });
  });

  router.patch('/:id/availability', (req, res) => {
    const doctor = doctorService.toggleAvailability(req.params.id);
    res.json({ doctor });
  });

  return router;
}
