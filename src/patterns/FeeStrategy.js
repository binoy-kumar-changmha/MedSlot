function assertValidBaseFee(baseFee) {
  if (typeof baseFee !== 'number' || !Number.isFinite(baseFee) || baseFee < 0) {
    throw new Error('Base fee must be a finite non-negative number');
  }
}

/**
 * Abstract Behavioral Strategy interface for consultation fee calculation.
 */
export class FeeStrategy {
  calculate(_baseFee) {
    throw new Error('FeeStrategy.calculate() must be implemented by subclasses');
  }

  describe() {
    throw new Error('FeeStrategy.describe() must be implemented by subclasses');
  }
}

/** Standard consultation billing (1.0x doctor base fee). */
export class StandardFeeStrategy extends FeeStrategy {
  calculate(baseFee) {
    assertValidBaseFee(baseFee);
    return Math.round(baseFee);
  }

  describe() {
    return { name: 'STANDARD', multiplier: 1.0, surcharge: 0 };
  }
}

/** Follow-up consultation billing (0.5x doctor base fee). */
export class FollowUpFeeStrategy extends FeeStrategy {
  calculate(baseFee) {
    assertValidBaseFee(baseFee);
    return Math.round(baseFee * 0.5);
  }

  describe() {
    return { name: 'FOLLOW_UP', multiplier: 0.5, surcharge: 0 };
  }
}

/** Emergency consultation billing (1.5x base fee + urgent triage surcharge). */
export class EmergencyFeeStrategy extends FeeStrategy {
  static URGENT_SURCHARGE = 200;

  calculate(baseFee) {
    assertValidBaseFee(baseFee);
    return Math.round(baseFee * 1.5 + EmergencyFeeStrategy.URGENT_SURCHARGE);
  }

  describe() {
    return {
      name: 'EMERGENCY',
      multiplier: 1.5,
      surcharge: EmergencyFeeStrategy.URGENT_SURCHARGE,
      policyNote: 'Includes urgent triage room allocation',
    };
  }
}

/**
 * Context class that delegates fee computation to the active FeeStrategy.
 */
export class FeeCalculator {
  constructor(strategy = new StandardFeeStrategy()) {
    this.setStrategy(strategy);
  }

  setStrategy(strategy) {
    if (!strategy || typeof strategy.calculate !== 'function') {
      throw new Error('A valid FeeStrategy instance is required');
    }
    this.strategy = strategy;
  }

  calculate(baseFee, discountPercent = 0) {
    // Clinic standard discount range validation
    if (typeof discountPercent !== 'number' || !Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) {
      throw new Error('Discount percentage must be between 0 and 100');
    }

    const grossAmount = this.strategy.calculate(baseFee);
    const discountAmount = Math.round((grossAmount * discountPercent) / 100);
    const finalAmount = Math.max(0, grossAmount - discountAmount);

    return {
      baseFee,
      grossAmount,
      discountPercent,
      discountAmount,
      finalAmount,
      strategy: this.strategy.describe(),
    };
  }
}

const STRATEGY_BY_VISIT_TYPE = {
  STANDARD: () => new StandardFeeStrategy(),
  FOLLOW_UP: () => new FollowUpFeeStrategy(),
  EMERGENCY: () => new EmergencyFeeStrategy(),
};

/**
 * Resolves the concrete FeeStrategy matching a given appointment visit type.
 */
export function createFeeStrategyForVisitType(visitType) {
  const normalized = String(visitType || 'STANDARD').trim().toUpperCase();
  const builder = STRATEGY_BY_VISIT_TYPE[normalized];
  if (!builder) {
    throw new Error(`Unsupported visit type for fee calculation: ${normalized}`);
  }
  return builder();
}
