import { Router } from 'express';

export function createPatientRoutes({ patientService, authMiddleware }) {
  const router = Router();
  router.use(authMiddleware);

  router.get('/', (req, res) => {
    const patients = patientService.listPatients(req.query.search || '');
    res.json({ patients });
  });

  router.get('/:id', (req, res) => {
    const patient = patientService.getPatientById(req.params.id);
    res.json({ patient });
  });

  router.post('/', (req, res) => {
    const patient = patientService.createPatient(req.body || {});
    res.status(201).json({ patient });
  });

  router.put('/:id', (req, res) => {
    const patient = patientService.updatePatient(req.params.id, req.body || {});
    res.json({ patient });
  });

  router.delete('/:id', (req, res) => {
    const result = patientService.deletePatient(req.params.id);
    res.json(result);
  });

  return router;
}
