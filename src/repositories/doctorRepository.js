function mapDoctor(row) {
  if (!row) return null;
  const plain = { ...row };
  return {
    id: Number(plain.id),
    fullName: plain.full_name,
    specialty: plain.specialty,
    consultationFee: Number(plain.consultation_fee),
    available: Boolean(plain.available),
    createdAt: plain.created_at,
  };
}

export function createDoctorRepository(db) {
  return {
    findAll(specialty = '') {
      const filter = String(specialty || '').trim();
      const rows = filter
        ? db
            .prepare(
              'SELECT * FROM doctors WHERE lower(specialty) = lower(?) ORDER BY id ASC'
            )
            .all(filter)
        : db.prepare('SELECT * FROM doctors ORDER BY id ASC').all();
      return rows.map(mapDoctor);
    },

    findById(id) {
      const row = db.prepare('SELECT * FROM doctors WHERE id = ?').get(Number(id));
      return mapDoctor(row);
    },

    create({ fullName, specialty, consultationFee, available = true }) {
      const result = db
        .prepare(
          'INSERT INTO doctors (full_name, specialty, consultation_fee, available) VALUES (?, ?, ?, ?)'
        )
        .run(fullName, specialty, Number(consultationFee), available ? 1 : 0);
      return this.findById(Number(result.lastInsertRowid));
    },

    setAvailability(id, available) {
      db.prepare('UPDATE doctors SET available = ? WHERE id = ?').run(
        available ? 1 : 0,
        Number(id)
      );
      return this.findById(id);
    },

    countAvailable() {
      const row = db.prepare('SELECT COUNT(*) AS count FROM doctors WHERE available = 1').get();
      return Number(row?.count || 0);
    },
  };
}
