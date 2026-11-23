import { describe, it, expect, vi } from 'vitest';
import { createBillingService } from '../../src/services/billingService.js';

describe('BillingService (with mocked repositories and paymentGateway)', () => {
  it('generates an EMERGENCY invoice using EmergencyFeeStrategy', () => {
    const invoiceRepo = {
      findByAppointmentId: vi.fn().mockReturnValue(null),
      create: vi.fn().mockImplementation((data) => ({ id: 21, ...data })),
    };
    const appointmentRepo = {
      findById: vi.fn().mockReturnValue({
        id: 8,
        patientId: 3,
        doctorId: 1,
        visitType: 'EMERGENCY',
        doctorBaseFee: 800,
        status: 'SCHEDULED',
      }),
    };

    const service = createBillingService({ invoiceRepo, appointmentRepo });
    const invoice = service.generateInvoice({ appointmentId: 8, discountPercent: 0 });

    expect(invoice.finalAmount).toBe(1400);
    expect(invoice.strategyName).toBe('EMERGENCY');
    expect(invoice.status).toBe('UNPAID');
  });

  it('pays an unpaid invoice through the mocked PaymentGatewayAdapter', async () => {
    const invoiceRepo = {
      findById: vi.fn().mockReturnValue({ id: 21, finalAmount: 1400, status: 'UNPAID' }),
      markPaid: vi.fn().mockImplementation((id, payment) => ({
        id,
        status: 'PAID',
        ...payment,
      })),
    };
    const paymentGateway = {
      charge: vi.fn().mockResolvedValue({
        approved: true,
        transactionRef: 'BANK-INV-21-OK',
        settledAmount: 1400,
        channel: 'POS_CARD',
        reason: null,
      }),
    };

    const service = createBillingService({ invoiceRepo, paymentGateway });
    const paid = await service.payInvoice(21, { method: 'CARD' });

    expect(paymentGateway.charge).toHaveBeenCalledWith({
      amount: 1400,
      invoiceId: 21,
      method: 'CARD',
    });
    expect(paid.status).toBe('PAID');
    expect(paid.transactionRef).toBe('BANK-INV-21-OK');
  });

  it('rejects declined payments without marking invoice as PAID', async () => {
    const invoiceRepo = {
      findById: vi.fn().mockReturnValue({ id: 22, finalAmount: 600, status: 'UNPAID' }),
      markPaid: vi.fn(),
    };
    const paymentGateway = {
      charge: vi.fn().mockResolvedValue({
        approved: false,
        transactionRef: null,
        settledAmount: 0,
        channel: 'MFS_BKASH',
        reason: 'Gateway timeout',
      }),
    };

    const service = createBillingService({ invoiceRepo, paymentGateway });
    await expect(service.payInvoice(22, { method: 'BKASH' })).rejects.toThrow(/Gateway timeout/i);
    expect(invoiceRepo.markPaid).not.toHaveBeenCalled();
  });

  it('aggregates clinic dashboard KPIs from repositories', () => {
    const service = createBillingService({
      patientRepo: { countAll: vi.fn().mockReturnValue(12) },
      doctorRepo: { countAvailable: vi.fn().mockReturnValue(4) },
      appointmentRepo: {
        countByStatus: vi.fn((status) => (status === 'SCHEDULED' ? 5 : 9)),
      },
      invoiceRepo: {
        summarizeRevenue: vi.fn().mockReturnValue({ totalRevenue: 7400, unpaidInvoices: 2 }),
      },
    });

    expect(service.getDashboardSummary()).toEqual({
      totalPatients: 12,
      availableDoctors: 4,
      scheduledAppointments: 5,
      completedAppointments: 9,
      totalRevenue: 7400,
      unpaidInvoices: 2,
    });
  });
});
