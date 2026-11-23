import { AppError } from '../middleware/errorMiddleware.js';

function validatePatientInput({ fullName, phone, email, age, gender, bloodGroup }) {
  const cleanName = String(fullName || '').trim();
  const cleanPhone = String(phone || '').trim();
  const numericAge = Number(age);

  if (!cleanName || !cleanPhone) {
    throw new AppError('Patient fullName and phone are required', 400);
  }
  if (!Number.isInteger(numericAge) || numericAge < 0 || numericAge > 130) {
    throw new AppError('Patient age must be an integer between 0 and 130', 400);
  }

  return {
    fullName: cleanName,
    phone: cleanPhone,
    email: String(email || '').trim(),
    age: numericAge,
    gender: String(gender || 'Other').trim() || 'Other',
    bloodGroup: String(bloodGroup || 'O+').trim().toUpperCase() || 'O+',
  };
}

/**
 * Patients Module Service: manages patient profiles and directory search.
 */
export function createPatientService({ patientRepo }) {
  return {
    listPatients(search = '') {
      return patientRepo.findAll(search);
    },

    getPatientById(id) {
      const patient = patientRepo.findById(id);
      if (!patient) {
        throw new AppError('Patient not found', 404);
      }
      return patient;
    },

    createPatient(payload) {
      const validated = validatePatientInput(payload);
      return patientRepo.create(validated);
    },

    updatePatient(id, payload) {
      this.getPatientById(id);
      const validated = validatePatientInput(payload);
      return patientRepo.update(id, validated);
    },

    deletePatient(id) {
      const deleted = patientRepo.delete(id);
      if (!deleted) {
        throw new AppError('Patient not found', 404);
      }
      return { deleted: true };
    },
  };
}
