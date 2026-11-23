function mapPatient(row) {
  if (!row) return null;
  const plain = { ...row };
  return {
    id: Number(plain.id),
    fullName: plain.full_name,
    phone: plain.phone,
    email: plain.email,
    age: Number(plain.age),
    gender: plain.gender,
    bloodGroup: plain.blood_group,
    createdAt: plain.created_at,
  };
}

export function createPatientRepository(db) {
  return {
    findAll(search = '') {
      const q = String(search || '').trim();
      const rows = q
        ? db
            .prepare(
              `SELECT * FROM patients
               WHERE lower(full_name) LIKE lower(?) OR phone LIKE ?
               ORDER BY id DESC`
            )
            .all(`%${q}%`, `%${q}%`)
        : db.prepare('SELECT * FROM patients ORDER BY id DESC').all();
      return rows.map(mapPatient);
    },

    findById(id) {
      const row = db.prepare('SELECT * FROM patients WHERE id = ?').get(Number(id));
      return mapPatient(row);
    },

    create({ fullName, phone, email = '', age, gender = 'Other', bloodGroup = 'O+' }) {
      const result = db
        .prepare(
          `INSERT INTO patients (full_name, phone, email, age, gender, blood_group)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(fullName, phone, email, Number(age), gender, bloodGroup);
      return this.findById(Number(result.lastInsertRowid));
    },

    update(id, { fullName, phone, email = '', age, gender = 'Other', bloodGroup = 'O+' }) {
      db.prepare(
        `UPDATE patients
         SET full_name = ?, phone = ?, email = ?, age = ?, gender = ?, blood_group = ?
         WHERE id = ?`
      ).run(fullName, phone, email, Number(age), gender, bloodGroup, Number(id));
      return this.findById(id);
    },

    delete(id) {
      const result = db.prepare('DELETE FROM patients WHERE id = ?').run(Number(id));
      return Number(result.changes) > 0;
    },

    countAll() {
      const row = db.prepare('SELECT COUNT(*) AS count FROM patients').get();
      return Number(row?.count || 0);
    },
  };
}
