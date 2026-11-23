import { describe, it, expect } from 'vitest';
import {
  AppointmentFactory,
  BaseAppointment,
  StandardAppointment,
  FollowUpAppointment,
  EmergencyAppointment,
} from '../../src/patterns/AppointmentFactory.js';

describe('AppointmentFactory (Creational — Factory Method)', () => {
  const basePayload = {
    patientId: 1,
    doctorId: 2,
    appointmentDate: '2026-12-01',
    timeSlot: '10:00',
    reason: 'General consultation',
  };

  it('creates a StandardAppointment with NORMAL priority and 20-minute duration', () => {
    const appt = AppointmentFactory.create('STANDARD', basePayload);
    expect(appt).toBeInstanceOf(StandardAppointment);
    expect(appt).toBeInstanceOf(BaseAppointment);
    expect(appt.toRecord()).toMatchObject({
      patientId: 1,
      doctorId: 2,
      visitType: 'STANDARD',
      priority: 'NORMAL',
      durationMinutes: 20,
      status: 'SCHEDULED',
    });
  });

  it('creates a FollowUpAppointment with LOW priority and 15-minute duration', () => {
    const appt = AppointmentFactory.create('follow_up', basePayload);
    expect(appt).toBeInstanceOf(FollowUpAppointment);
    expect(appt.toRecord()).toMatchObject({
      visitType: 'FOLLOW_UP',
      priority: 'LOW',
      durationMinutes: 15,
    });
  });

  it('creates an EmergencyAppointment with URGENT priority and 30-minute duration', () => {
    const appt = AppointmentFactory.create('EMERGENCY', basePayload);
    expect(appt).toBeInstanceOf(EmergencyAppointment);
    expect(appt.toRecord()).toMatchObject({
      visitType: 'EMERGENCY',
      priority: 'URGENT',
      durationMinutes: 30,
    });
  });

  it('throws an error for unsupported visit types', () => {
    expect(() => AppointmentFactory.create('TELEMEDICINE', basePayload)).toThrow(
      /Unsupported appointment type/i
    );
  });

  it('throws an error when required scheduling fields are missing', () => {
    expect(() =>
      AppointmentFactory.create('STANDARD', { patientId: 1, doctorId: 2 })
    ).toThrow(/required/i);
  });

  it('supports runtime registration of a new appointment creator (Open/Closed)', () => {
    class DentalCheckup extends BaseAppointment {
      constructor(payload) {
        super({
          ...payload,
          visitType: 'DENTAL',
          priority: 'NORMAL',
          durationMinutes: 25,
        });
      }
    }

    AppointmentFactory.registerCreator('DENTAL', (payload) => new DentalCheckup(payload));
    const appt = AppointmentFactory.create('DENTAL', basePayload);
    expect(appt.toRecord()).toMatchObject({
      visitType: 'DENTAL',
      durationMinutes: 25,
    });
  });
});
