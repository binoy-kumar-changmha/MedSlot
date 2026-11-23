import fs from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { createDatabase, seedDemoData } from './config/database.js';
import { loadOpenApiSpec } from './config/swagger.js';
import { createAuthMiddleware } from './middleware/authMiddleware.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import { PaymentGatewayAdapter } from './patterns/PaymentGatewayAdapter.js';
import { createAppointmentRepository } from './repositories/appointmentRepository.js';
import { createDoctorRepository } from './repositories/doctorRepository.js';
import { createInvoiceRepository } from './repositories/invoiceRepository.js';
import { createPatientRepository } from './repositories/patientRepository.js';
import { createUserRepository } from './repositories/userRepository.js';
import { createAppointmentRoutes } from './routes/appointmentRoutes.js';
import { createAuthRoutes } from './routes/authRoutes.js';
import { createBillingRoutes } from './routes/billingRoutes.js';
import { createDoctorRoutes } from './routes/doctorRoutes.js';
import { createPatientRoutes } from './routes/patientRoutes.js';
import { createAppointmentService } from './services/appointmentService.js';
import { createAuthService } from './services/authService.js';
import { createBillingService } from './services/billingService.js';
import { createDoctorService } from './services/doctorService.js';
import { createNotificationService } from './services/notificationService.js';
import { createPatientService } from './services/patientService.js';

/**
 * Composes the full MedSlot Express application with dependency-injected repositories,
 * services, design pattern implementations, and optional built SPA static assets.
 */
export function createApp({
  dbPath = path.resolve(process.cwd(), 'data/medslot.db'),
  seed = true,
  tokenSecret,
} = {}) {
  const db = createDatabase(dbPath);
  if (seed) {
    seedDemoData(db);
  }

  const userRepo = createUserRepository(db);
  const patientRepo = createPatientRepository(db);
  const doctorRepo = createDoctorRepository(db);
  const appointmentRepo = createAppointmentRepository(db);
  const invoiceRepo = createInvoiceRepository(db);

  const notificationService = createNotificationService();
  const paymentGateway = new PaymentGatewayAdapter();

  const authService = createAuthService({ userRepo, tokenSecret });
  const patientService = createPatientService({ patientRepo });
  const doctorService = createDoctorService({ doctorRepo });
  const appointmentService = createAppointmentService({
    appointmentRepo,
    patientRepo,
    doctorRepo,
    notificationService,
  });
  const billingService = createBillingService({
    invoiceRepo,
    appointmentRepo,
    doctorRepo,
    patientRepo,
    paymentGateway,
  });

  const authMiddleware = createAuthMiddleware(authService);

  const app = express();
  app.use(cors());
  app.use(express.json());

  const openApiSpec = loadOpenApiSpec();
  app.get('/api-docs.json', (_req, res) => {
    res.json(openApiSpec);
  });
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

  app.use('/api/auth', createAuthRoutes({ authService, authMiddleware }));
  app.use('/api/patients', createPatientRoutes({ patientService, authMiddleware }));
  app.use('/api/doctors', createDoctorRoutes({ doctorService, authMiddleware }));
  app.use('/api/appointments', createAppointmentRoutes({ appointmentService, authMiddleware }));
  app.use('/api/billing', createBillingRoutes({ billingService, authMiddleware }));

  const frontendDistDir = path.resolve(process.cwd(), 'frontend/dist');
  const indexHtmlPath = path.join(frontendDistDir, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    app.use(express.static(frontendDistDir));
    app.use((req, res, next) => {
      if (
        req.method === 'GET' &&
        !req.path.startsWith('/api') &&
        !req.path.startsWith('/api-docs')
      ) {
        return res.sendFile(indexHtmlPath);
      }
      next();
    });
  }

  app.use(errorMiddleware);

  return { app, db };
}
