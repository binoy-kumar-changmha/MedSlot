import { describe, it, expect, vi } from 'vitest';
import { createAppointmentService } from '../../src/services/appointmentService.js';

describe('AppointmentService (with mocked repositories and notificationService)', () => {
  const activeDoctor = { id: 2, fullName: 'Dr. Tariq', available: true, consultationFee: 800 };
  const samplePatient = { id: 1, fullName: 'Tanvir Ahmed' };

  it('books an EMERGENCY appointment via Factory and sends notification', () => {
    const appointmentRepo = {
      findConflict: vi.fn().mockReturnValue(null),
      create: vi.fn().mockImplementation((rec) => ({ id: 15, ...rec })),
    };
    const patientRepo = { findById: vi.fn().mockReturnValue(samplePatient) };
    const doctorRepo = { findById: vi.fn().mockReturnValue(activeDoctor) };
    const notificationService = { sendAppointmentNotice: vi.fn() };

    const service = createAppointmentService({
      appointmentRepo,
      patientRepo,
      doctorRepo,
      notificationService,
    });

    const appt = service.bookAppointment({
      patientId: 1,
      doctorId: 2,
      visitType: 'EMERGENCY',
      appointmentDate: '2026-12-01',
      timeSlot: '11:00',
      reason: 'High fever',
    });

    expect(appt.priority).toBe('URGENT');
    expect(appt.durationMinutes).toBe(30);
    expect(notificationService.sendAppointmentNotice).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'BOOKED', appointment: appt })
    );
  });

  it('prevents double-booking the same doctor date and slot', () => {
    const appointmentRepo = {
      findConflict: vi.fn().mockReturnValue({ id: 99 }),
      create: vi.fn(),
    };
    const patientRepo = { findById: vi.fn().mockReturnValue(samplePatient) };
    const doctorRepo = { findById: vi.fn().mockReturnValue(activeDoctor) };

    const service = createAppointmentService({ appointmentRepo, patientRepo, doctorRepo });

    expect(() =>
      service.bookAppointment({
        patientId: 1,
        doctorId: 2,
        visitType: 'STANDARD',
        appointmentDate: '2026-12-01',
        timeSlot: '11:00',
      })
    ).toThrow(/already has an active appointment/i);
    expect(appointmentRepo.create).not.toHaveBeenCalled();
  });

  it('rejects unavailable doctors and cancelled appointment reopening', () => {
    const appointmentRepo = {
      findById: vi.fn().mockReturnValue({ id: 3, status: 'CANCELLED' }),
    };
    const patientRepo = { findById: vi.fn().mockReturnValue(samplePatient) };
    const doctorRepo = { findById: vi.fn().mockReturnValue({ ...activeDoctor, available: false }) };

    const service = createAppointmentService({ appointmentRepo, patientRepo, doctorRepo });

    expect(() =>
      service.bookAppointment({
        patientId: 1,
        doctorId: 2,
        appointmentDate: '2026-12-01',
        timeSlot: '12:00',
      })
    ).toThrow(/unavailable/i);

    expect(() => service.updateStatus(3, 'COMPLETED')).toThrow(/cannot be reopened/i);
  });
});
