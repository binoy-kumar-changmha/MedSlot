/**
 * Base domain entity produced by AppointmentFactory.
 * Encapsulates common appointment fields and validation.
 */
export class BaseAppointment {
  constructor({
    patientId,
    doctorId,
    appointmentDate,
    timeSlot,
    reason = '',
    visitType,
    priority,
    durationMinutes,
    status = 'SCHEDULED',
  }) {
    if (!patientId || !doctorId || !appointmentDate || !timeSlot) {
      throw new Error('patientId, doctorId, appointmentDate, and timeSlot are required');
    }

    this.patientId = Number(patientId);
    this.doctorId = Number(doctorId);
    this.appointmentDate = String(appointmentDate).trim();
    this.timeSlot = String(timeSlot).trim();
    this.reason = String(reason || '').trim();
    this.visitType = visitType;
    this.priority = priority;
    this.durationMinutes = durationMinutes;
    this.status = status;
  }

  /**
   * Returns a plain persistence-ready record.
   */
  toRecord() {
    return {
      patientId: this.patientId,
      doctorId: this.doctorId,
      appointmentDate: this.appointmentDate,
      timeSlot: this.timeSlot,
      reason: this.reason,
      visitType: this.visitType,
      priority: this.priority,
      durationMinutes: this.durationMinutes,
      status: this.status,
    };
  }
}

/** Standard scheduled clinic consultation. */
export class StandardAppointment extends BaseAppointment {
  constructor(payload) {
    super({
      ...payload,
      visitType: 'STANDARD',
      priority: 'NORMAL',
      durationMinutes: 20,
    });
  }
}

/** Shorter follow-up review consultation. */
export class FollowUpAppointment extends BaseAppointment {
  constructor(payload) {
    super({
      ...payload,
      visitType: 'FOLLOW_UP',
      priority: 'LOW',
      durationMinutes: 15,
    });
  }
}

/** High-priority urgent clinic consultation. */
export class EmergencyAppointment extends BaseAppointment {
  constructor(payload) {
    super({
      ...payload,
      visitType: 'EMERGENCY',
      priority: 'URGENT',
      durationMinutes: 30,
    });
  }
}

/**
 * Creational Pattern — Factory Method.
 * Decouples appointment creation from callers while keeping new visit types open for extension.
 */
export class AppointmentFactory {
  static #creators = new Map([
    ['STANDARD', (payload) => new StandardAppointment(payload)],
    ['FOLLOW_UP', (payload) => new FollowUpAppointment(payload)],
    ['EMERGENCY', (payload) => new EmergencyAppointment(payload)],
  ]);

  /**
   * Creates a typed appointment instance from a visit type string.
   */
  static create(type, payload) {
    const normalized = String(type || 'STANDARD').trim().toUpperCase();
    const creator = this.#creators.get(normalized);
    if (!creator) {
      throw new Error(`Unsupported appointment type: ${normalized}`);
    }
    return creator(payload);
  }

  /**
   * Registers an additional appointment creator without modifying core switch logic.
   */
  static registerCreator(type, creatorFn) {
    const normalized = String(type || '').trim().toUpperCase();
    if (!normalized || typeof creatorFn !== 'function') {
      throw new Error('A valid type name and creator function are required');
    }
    this.#creators.set(normalized, creatorFn);
  }

  /**
   * Returns all currently registered appointment visit types.
   */
  static listSupportedTypes() {
    return Array.from(this.#creators.keys());
  }
}
