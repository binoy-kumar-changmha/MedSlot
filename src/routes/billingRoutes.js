import { Router } from 'express';

export function createBillingRoutes({ billingService, authMiddleware }) {
  const router = Router();
  router.use(authMiddleware);

  router.get('/summary', (_req, res) => {
    const summary = billingService.getDashboardSummary();
    res.json({ summary });
  });

  router.get('/invoices', (_req, res) => {
    const invoices = billingService.listInvoices();
    res.json({ invoices });
  });

  router.post('/invoices', (req, res) => {
    const invoice = billingService.generateInvoice(req.body || {});
    res.status(201).json({ invoice });
  });

  router.post('/invoices/:id/pay', async (req, res) => {
    const invoice = await billingService.payInvoice(req.params.id, req.body || {});
    res.json({ invoice });
  });

  return router;
}
