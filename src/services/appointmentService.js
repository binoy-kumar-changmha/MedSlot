import { AppError } from '../middleware/errorMiddleware.js';
import { AppointmentFactory } from '../patterns/AppointmentFactory.js';

const ALLOWED_STATUSES = new Set(['SCHEDULED', 'COMPLETED', 'CANCELLED']);

/**
 * Appointments Module Service: schedules visits via AppointmentFactory,
 * guards against doctor slot collisions, and dispatches appointment notices.
 */
export function createAppointmentService({
  appointmentRepo,
  patientRepo,
  doctorRepo,
  notificationService,
}) {
  return {
    listAppointments(status = '') {
      return appointmentRepo.findAll(status);
    },

    bookAppointment({
      patientId,
      doctorId,
      visitType = 'STANDARD',
      appointmentDate,
      timeSlot,
      reason = '',
    }) {
      const patient = patientRepo.findById(patientId);
      if (!patient) {
        throw new AppError('Patient not found', 404);
      }

      const doctor = doctorRepo.findById(doctorId);
      if (!doctor) {
        throw new AppError('Doctor not found', 404);
      }
      if (!doctor.available) {
        throw new AppError('Selected doctor is currently unavailable', 400);
      }

      const cleanDate = String(appointmentDate || '').trim();
      const cleanSlot = String(timeSlot || '').trim();
      if (!cleanDate || !cleanSlot) {
        throw new AppError('appointmentDate and timeSlot are required', 400);
      }

      const conflict = appointmentRepo.findConflict(doctor.id, cleanDate, cleanSlot);
      if (conflict) {
        throw new AppError(
          `Doctor already has an active appointment on ${cleanDate} at ${cleanSlot}`,
          409
        );
      }

      let appointmentEntity;
      try {
        appointmentEntity = AppointmentFactory.create(visitType, {
          patientId: patient.id,
          doctorId: doctor.id,
          appointmentDate: cleanDate,
          timeSlot: cleanSlot,
          reason,
        });
      } catch (err) {
        throw new AppError(err.message, 400);
      }

      const saved = appointmentRepo.create(appointmentEntity.toRecord());

      if (notificationService?.sendAppointmentNotice) {
        notificationService.sendAppointmentNotice({
          event: 'BOOKED',
          appointment: saved,
          patient,
          doctor,
        });
      }

      return saved;
    },

    updateStatus(id, nextStatus) {
      const normalized = String(nextStatus || '').trim().toUpperCase();
      if (!ALLOWED_STATUSES.has(normalized)) {
        throw new AppError(`Invalid appointment status: ${normalized}`, 400);
      }

      const existing = appointmentRepo.findById(id);
      if (!existing) {
        throw new AppError('Appointment not found', 404);
      }
      if (existing.status === 'CANCELLED' && normalized !== 'CANCELLED') {
        throw new AppError('Cancelled appointments cannot be reopened', 400);
      }

      const updated = appointmentRepo.updateStatus(existing.id, normalized);

      if (notificationService?.sendAppointmentNotice) {
        notificationService.sendAppointmentNotice({
          event: normalized,
          appointment: updated,
        });
      }

      return updated;
    },
  };
}
