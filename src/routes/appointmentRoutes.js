import { Router } from 'express';

export function createAppointmentRoutes({ appointmentService, authMiddleware }) {
  const router = Router();
  router.use(authMiddleware);

  router.get('/', (req, res) => {
    const appointments = appointmentService.listAppointments(req.query.status || '');
    res.json({ appointments });
  });

  router.post('/', (req, res) => {
    const appointment = appointmentService.bookAppointment(req.body || {});
    res.status(201).json({ appointment });
  });

  router.patch('/:id/status', (req, res) => {
    const appointment = appointmentService.updateStatus(
      req.params.id,
      req.body?.status
    );
    res.json({ appointment });
  });

  return router;
}
