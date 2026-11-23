import { describe, it, expect, vi } from 'vitest';
import {
  PaymentGatewayAdapter,
  PaymentProcessor,
  SimulatedBankSDK,
} from '../../src/patterns/PaymentGatewayAdapter.js';

describe('PaymentGatewayAdapter (Structural — Adapter)', () => {
  it('translates internal charge({ amount, invoiceId, method }) to SimulatedBankSDK cents API', async () => {
    const mockSdk = {
      processTransaction: vi.fn().mockResolvedValue({
        ok: true,
        bankTxnId: 'BANK-REF-9001',
        settledCents: 140000,
        channelUsed: 'POS_CARD',
      }),
    };

    const adapter = new PaymentGatewayAdapter({ bankSdk: mockSdk });
    expect(adapter).toBeInstanceOf(PaymentProcessor);

    const receipt = await adapter.charge({
      amount: 1400,
      invoiceId: 12,
      method: 'CARD',
    });

    expect(mockSdk.processTransaction).toHaveBeenCalledWith({
      totalCents: 140000,
      externalRef: 'INV-12',
      channel: 'CARD',
    });
    expect(receipt).toEqual({
      approved: true,
      transactionRef: 'BANK-REF-9001',
      settledAmount: 1400,
      channel: 'POS_CARD',
      reason: null,
    });
  });

  it('normalizes declined bank responses without leaking SDK internals', async () => {
    const mockSdk = {
      processTransaction: vi.fn().mockResolvedValue({
        ok: false,
        bankTxnId: null,
        settledCents: 0,
        channelUsed: 'MFS_BKASH',
        errorMessage: 'Insufficient balance',
      }),
    };

    const adapter = new PaymentGatewayAdapter({ bankSdk: mockSdk });
    const receipt = await adapter.charge({
      amount: 600,
      invoiceId: 5,
      method: 'BKASH',
    });

    expect(receipt).toEqual({
      approved: false,
      transactionRef: null,
      settledAmount: 0,
      channel: 'MFS_BKASH',
      reason: 'Insufficient balance',
    });
  });

  it('rejects non-positive payment amounts before calling the external SDK', async () => {
    const mockSdk = { processTransaction: vi.fn() };
    const adapter = new PaymentGatewayAdapter({ bankSdk: mockSdk });

    await expect(
      adapter.charge({ amount: 0, invoiceId: 1, method: 'CASH' })
    ).rejects.toThrow(/greater than zero/i);
    expect(mockSdk.processTransaction).not.toHaveBeenCalled();
  });

  it('works end-to-end with the default SimulatedBankSDK implementation', async () => {
    const adapter = new PaymentGatewayAdapter({ bankSdk: new SimulatedBankSDK() });
    const receipt = await adapter.charge({ amount: 800, invoiceId: 9, method: 'CASH' });

    expect(receipt.approved).toBe(true);
    expect(receipt.settledAmount).toBe(800);
    expect(receipt.channel).toBe('COUNTER_CASH');
    expect(receipt.transactionRef).toMatch(/^BANK-INV-9-/);

    const unsupported = await adapter.charge({ amount: 500, invoiceId: 10, method: 'CRYPTO' });
    expect(unsupported.approved).toBe(false);
    expect(unsupported.reason).toMatch(/Unsupported payment channel/i);
    await expect(adapter.charge({ amount: 500, method: 'CARD' })).rejects.toThrow(/invoiceId/i);
  });
});
