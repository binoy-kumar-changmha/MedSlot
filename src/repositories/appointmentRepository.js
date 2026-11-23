function mapAppointment(row) {
  if (!row) return null;
  const plain = { ...row };
  return {
    id: Number(plain.id),
    patientId: Number(plain.patient_id),
    doctorId: Number(plain.doctor_id),
    patientName: plain.patient_name || undefined,
    doctorName: plain.doctor_name || undefined,
    doctorSpecialty: plain.doctor_specialty || undefined,
    doctorBaseFee: plain.doctor_base_fee !== undefined ? Number(plain.doctor_base_fee) : undefined,
    visitType: plain.visit_type,
    priority: plain.priority,
    durationMinutes: Number(plain.duration_minutes),
    appointmentDate: plain.appointment_date,
    timeSlot: plain.time_slot,
    reason: plain.reason,
    status: plain.status,
    createdAt: plain.created_at,
  };
}

const APPOINTMENT_SELECT = `
  SELECT
    a.*,
    p.full_name AS patient_name,
    d.full_name AS doctor_name,
    d.specialty AS doctor_specialty,
    d.consultation_fee AS doctor_base_fee
  FROM appointments a
  JOIN patients p ON p.id = a.patient_id
  JOIN doctors d ON d.id = a.doctor_id
`;

export function createAppointmentRepository(db) {
  return {
    findAll(status = '') {
      const filter = String(status || '').trim().toUpperCase();
      const rows =
        filter && filter !== 'ALL'
          ? db
              .prepare(
                `${APPOINTMENT_SELECT} WHERE a.status = ? ORDER BY a.appointment_date DESC, a.time_slot ASC`
              )
              .all(filter)
          : db
              .prepare(`${APPOINTMENT_SELECT} ORDER BY a.id DESC`)
              .all();
      return rows.map(mapAppointment);
    },

    findById(id) {
      const row = db
        .prepare(`${APPOINTMENT_SELECT} WHERE a.id = ?`)
        .get(Number(id));
      return mapAppointment(row);
    },

    findConflict(doctorId, appointmentDate, timeSlot) {
      const row = db
        .prepare(
          `SELECT * FROM appointments
           WHERE doctor_id = ? AND appointment_date = ? AND time_slot = ? AND status != 'CANCELLED'`
        )
        .get(Number(doctorId), appointmentDate, timeSlot);
      return mapAppointment(row);
    },

    create({
      patientId,
      doctorId,
      visitType,
      priority,
      durationMinutes,
      appointmentDate,
      timeSlot,
      reason,
      status = 'SCHEDULED',
    }) {
      const result = db
        .prepare(
          `INSERT INTO appointments (patient_id, doctor_id, visit_type, priority, duration_minutes, appointment_date, time_slot, reason, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          Number(patientId),
          Number(doctorId),
          visitType,
          priority,
          Number(durationMinutes),
          appointmentDate,
          timeSlot,
          reason || '',
          status
        );
      return this.findById(Number(result.lastInsertRowid));
    },

    updateStatus(id, status) {
      db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, Number(id));
      return this.findById(id);
    },

    countByStatus(status) {
      const row = db
        .prepare('SELECT COUNT(*) AS count FROM appointments WHERE status = ?')
        .get(status);
      return Number(row?.count || 0);
    },
  };
}
