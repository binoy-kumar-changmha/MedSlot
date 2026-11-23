import { describe, it, expect, vi } from 'vitest';
import { createPatientService } from '../../src/services/patientService.js';

describe('PatientService (with mocked patientRepository)', () => {
  it('lists and searches patients through repository', () => {
    const patientRepo = {
      findAll: vi.fn().mockReturnValue([{ id: 1, fullName: 'Tanvir Ahmed' }]),
    };
    const service = createPatientService({ patientRepo });

    const list = service.listPatients('Tanvir');
    expect(patientRepo.findAll).toHaveBeenCalledWith('Tanvir');
    expect(list).toHaveLength(1);
  });

  it('validates and creates a patient record', () => {
    const patientRepo = {
      create: vi.fn().mockImplementation((dto) => ({ id: 10, ...dto })),
    };
    const service = createPatientService({ patientRepo });

    const created = service.createPatient({
      fullName: 'Farhana Akter',
      phone: '01711000999',
      email: 'farhana@example.com',
      age: 26,
      gender: 'Female',
      bloodGroup: 'o+',
    });

    expect(created.bloodGroup).toBe('O+');
    expect(patientRepo.create).toHaveBeenCalledWith({
      fullName: 'Farhana Akter',
      phone: '01711000999',
      email: 'farhana@example.com',
      age: 26,
      gender: 'Female',
      bloodGroup: 'O+',
    });
  });

  it('rejects invalid age and throws 404 when updating or deleting missing patients', () => {
    const patientRepo = {
      findById: vi.fn().mockReturnValue(null),
      delete: vi.fn().mockReturnValue(false),
    };
    const service = createPatientService({ patientRepo });

    expect(() =>
      service.createPatient({ fullName: 'Invalid', phone: '0170', age: -5 })
    ).toThrow(/age must be/i);
    expect(() => service.getPatientById(999)).toThrow(/not found/i);
    expect(() => service.deletePatient(999)).toThrow(/not found/i);
  });
});
