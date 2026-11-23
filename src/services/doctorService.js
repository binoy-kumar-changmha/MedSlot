import { AppError } from '../middleware/errorMiddleware.js';

/**
 * Doctors Module Service: manages clinic physicians, specialties, fees, and availability.
 */
export function createDoctorService({ doctorRepo }) {
  return {
    listDoctors(specialty = '') {
      return doctorRepo.findAll(specialty);
    },

    createDoctor({ fullName, specialty, consultationFee, available = true }) {
      const cleanName = String(fullName || '').trim();
      const cleanSpecialty = String(specialty || '').trim();
      const fee = Number(consultationFee);

      if (!cleanName || !cleanSpecialty) {
        throw new AppError('Doctor fullName and specialty are required', 400);
      }
      if (!Number.isFinite(fee) || fee < 0) {
        throw new AppError('consultationFee must be a non-negative number', 400);
      }

      return doctorRepo.create({
        fullName: cleanName,
        specialty: cleanSpecialty,
        consultationFee: fee,
        available: Boolean(available),
      });
    },

    toggleAvailability(id) {
      const doctor = doctorRepo.findById(id);
      if (!doctor) {
        throw new AppError('Doctor not found', 404);
      }
      return doctorRepo.setAvailability(doctor.id, !doctor.available);
    },
  };
}
