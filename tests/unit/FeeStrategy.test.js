import { describe, it, expect } from 'vitest';
import {
  FeeCalculator,
  StandardFeeStrategy,
  FollowUpFeeStrategy,
  EmergencyFeeStrategy,
  createFeeStrategyForVisitType,
} from '../../src/patterns/FeeStrategy.js';

describe('FeeStrategy & FeeCalculator (Behavioral — Strategy)', () => {
  it('calculates 1.0x base fee under StandardFeeStrategy', () => {
    const calculator = new FeeCalculator(new StandardFeeStrategy());
    const result = calculator.calculate(800);
    expect(result).toMatchObject({
      baseFee: 800,
      grossAmount: 800,
      discountAmount: 0,
      finalAmount: 800,
    });
    expect(result.strategy.name).toBe('STANDARD');
  });

  it('calculates 0.5x base fee under FollowUpFeeStrategy', () => {
    const calculator = new FeeCalculator(new FollowUpFeeStrategy());
    const result = calculator.calculate(1200);
    expect(result.grossAmount).toBe(600);
    expect(result.finalAmount).toBe(600);
    expect(result.strategy.name).toBe('FOLLOW_UP');
  });

  it('calculates 1.5x base fee plus 200 surcharge under EmergencyFeeStrategy', () => {
    const calculator = new FeeCalculator(new EmergencyFeeStrategy());
    const result = calculator.calculate(800);
    expect(result.grossAmount).toBe(1400);
    expect(result.finalAmount).toBe(1400);
    expect(result.strategy.surcharge).toBe(200);
  });

  it('switches strategy dynamically at runtime and applies discount percentage', () => {
    const calculator = new FeeCalculator(new StandardFeeStrategy());
    calculator.setStrategy(new EmergencyFeeStrategy());
    const result = calculator.calculate(1000, 10);
    expect(result.grossAmount).toBe(1700);
    expect(result.discountAmount).toBe(170);
    expect(result.finalAmount).toBe(1530);
  });

  it('maps visit types to matching strategies and rejects invalid inputs', () => {
    expect(createFeeStrategyForVisitType('STANDARD')).toBeInstanceOf(StandardFeeStrategy);
    expect(createFeeStrategyForVisitType('FOLLOW_UP')).toBeInstanceOf(FollowUpFeeStrategy);
    expect(createFeeStrategyForVisitType('EMERGENCY')).toBeInstanceOf(EmergencyFeeStrategy);
    expect(() => createFeeStrategyForVisitType('UNKNOWN')).toThrow(/Unsupported visit type/i);
    expect(() => new StandardFeeStrategy().calculate(-50)).toThrow(/non-negative/i);
  });
});
