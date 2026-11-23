const CHANNEL_MAP = {
  CARD: 'POS_CARD',
  BKASH: 'MFS_BKASH',
  CASH: 'COUNTER_CASH',
};

/**
 * Simulated external bank SDK with an incompatible legacy contract (cents & externalRef).
 */
export class SimulatedBankSDK {
  async processTransaction({ totalCents, externalRef, channel }) {
    if (!Number.isInteger(totalCents) || totalCents <= 0) {
      return {
        ok: false,
        bankTxnId: null,
        settledCents: 0,
        channelUsed: CHANNEL_MAP[channel] || 'UNKNOWN',
        errorMessage: 'Transaction amount in cents must be positive',
      };
    }

    const mappedChannel = CHANNEL_MAP[String(channel || 'CARD').toUpperCase()];
    if (!mappedChannel) {
      return {
        ok: false,
        bankTxnId: null,
        settledCents: 0,
        channelUsed: 'UNKNOWN',
        errorMessage: `Unsupported payment channel: ${channel}`,
      };
    }

    return {
      ok: true,
      bankTxnId: `BANK-${externalRef}-${Date.now().toString(36).toUpperCase()}`,
      settledCents: totalCents,
      channelUsed: mappedChannel,
    };
  }
}

/**
 * Target interface expected by MedSlot BillingService.
 */
export class PaymentProcessor {
  async charge(_paymentRequest) {
    throw new Error('PaymentProcessor.charge() must be implemented');
  }
}

/**
 * Structural Pattern — Adapter.
 * Bridges MedSlot's internal charge({ amount, invoiceId, method }) contract
 * to SimulatedBankSDK.processTransaction({ totalCents, externalRef, channel }).
 */
export class PaymentGatewayAdapter extends PaymentProcessor {
  constructor({ bankSdk = new SimulatedBankSDK() } = {}) {
    super();
    this.bankSdk = bankSdk;
  }

  async charge({ amount, invoiceId, method = 'CARD' }) {
    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }
    if (!invoiceId) {
      throw new Error('invoiceId is required to charge payment');
    }

    const totalCents = Math.round(amount * 100);
    const normalizedMethod = String(method || 'CARD').trim().toUpperCase();

    const bankReceipt = await this.bankSdk.processTransaction({
      totalCents,
      externalRef: `INV-${invoiceId}`,
      channel: normalizedMethod,
    });

    return {
      approved: Boolean(bankReceipt.ok),
      transactionRef: bankReceipt.bankTxnId ?? null,
      settledAmount: Number(((bankReceipt.settledCents ?? 0) / 100).toFixed(2)),
      channel: bankReceipt.channelUsed || normalizedMethod,
      reason: bankReceipt.errorMessage ?? null,
    };
  }
}
