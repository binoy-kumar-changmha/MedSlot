import { describe, it, expect, vi } from 'vitest';
import { createDoctorService } from '../../src/services/doctorService.js';

describe('DoctorService (with mocked doctorRepository)', () => {
  it('lists doctors filtered by specialty', () => {
    const doctorRepo = {
      findAll: vi.fn().mockReturnValue([{ id: 2, fullName: 'Dr. Sabrina', specialty: 'Cardiology' }]),
    };
    const service = createDoctorService({ doctorRepo });

    const doctors = service.listDoctors('Cardiology');
    expect(doctorRepo.findAll).toHaveBeenCalledWith('Cardiology');
    expect(doctors).toHaveLength(1);
  });

  it('creates a doctor and toggles availability cleanly', () => {
    const doctorRepo = {
      create: vi.fn().mockImplementation((d) => ({ id: 4, ...d })),
      findById: vi.fn().mockReturnValue({ id: 4, available: true }),
      setAvailability: vi.fn().mockReturnValue({ id: 4, available: false }),
    };
    const service = createDoctorService({ doctorRepo });

    const doc = service.createDoctor({
      fullName: 'Dr. Kamal Uddin',
      specialty: 'Orthopedics',
      consultationFee: 1000,
    });
    expect(doc.consultationFee).toBe(1000);

    const toggled = service.toggleAvailability(4);
    expect(doctorRepo.setAvailability).toHaveBeenCalledWith(4, false);
    expect(toggled.available).toBe(false);
  });

  it('rejects negative fees and missing doctors on toggle', () => {
    const doctorRepo = {
      findById: vi.fn().mockReturnValue(null),
    };
    const service = createDoctorService({ doctorRepo });

    expect(() =>
      service.createDoctor({ fullName: 'Dr. X', specialty: 'ENT', consultationFee: -100 })
    ).toThrow(/non-negative/i);
    expect(() => service.toggleAvailability(99)).toThrow(/not found/i);
  });
});
