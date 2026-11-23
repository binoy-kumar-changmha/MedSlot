import { AppError } from '../middleware/errorMiddleware.js';
import {
  FeeCalculator,
  createFeeStrategyForVisitType,
} from '../patterns/FeeStrategy.js';

/**
 * Billing Module Service: computes consultation invoices using FeeStrategy
 * and settles payments through an injected PaymentProcessor adapter.
 */
export function createBillingService({
  invoiceRepo,
  appointmentRepo,
  doctorRepo,
  patientRepo,
  paymentGateway,
}) {
  return {
    listInvoices() {
      return invoiceRepo.findAll();
    },

    generateInvoice({ appointmentId, discountPercent = 0 }) {
      const appointment = appointmentRepo.findById(appointmentId);
      if (!appointment) {
        throw new AppError('Appointment not found', 404);
      }
      if (appointment.status === 'CANCELLED') {
        throw new AppError('Cannot generate an invoice for a cancelled appointment', 400);
      }

      const existing = invoiceRepo.findByAppointmentId(appointment.id);
      if (existing) {
        throw new AppError('An invoice already exists for this appointment', 409);
      }

      const baseFee =
        appointment.doctorBaseFee ??
        doctorRepo?.findById(appointment.doctorId)?.consultationFee;

      if (baseFee === undefined) {
        throw new AppError('Doctor consultation fee could not be resolved', 400);
      }

      let feeBreakdown;
      try {
        const strategy = createFeeStrategyForVisitType(appointment.visitType);
        const calculator = new FeeCalculator(strategy);
        feeBreakdown = calculator.calculate(Number(baseFee), Number(discountPercent));
      } catch (err) {
        throw new AppError(err.message, 400);
      }

      return invoiceRepo.create({
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        baseAmount: feeBreakdown.baseFee,
        discountPercent: feeBreakdown.discountPercent,
        finalAmount: feeBreakdown.finalAmount,
        strategyName: feeBreakdown.strategy.name,
        status: 'UNPAID',
      });
    },

    async payInvoice(invoiceId, { method = 'CARD' } = {}) {
      const invoice = invoiceRepo.findById(invoiceId);
      if (!invoice) {
        throw new AppError('Invoice not found', 404);
      }
      if (invoice.status === 'PAID') {
        throw new AppError('Invoice has already been paid', 409);
      }

      const receipt = await paymentGateway.charge({
        amount: invoice.finalAmount,
        invoiceId: invoice.id,
        method,
      });

      if (!receipt.approved) {
        throw new AppError(receipt.reason || 'Payment declined by payment gateway', 402);
      }

      return invoiceRepo.markPaid(invoice.id, {
        paymentMethod: receipt.channel,
        transactionRef: receipt.transactionRef,
        paidAt: new Date().toISOString(),
      });
    },

    getDashboardSummary() {
      const revenue = invoiceRepo.summarizeRevenue();
      return {
        totalPatients: patientRepo.countAll(),
        availableDoctors: doctorRepo.countAvailable(),
        scheduledAppointments: appointmentRepo.countByStatus('SCHEDULED'),
        completedAppointments: appointmentRepo.countByStatus('COMPLETED'),
        totalRevenue: revenue.totalRevenue,
        unpaidInvoices: revenue.unpaidInvoices,
      };
    },
  };
}
