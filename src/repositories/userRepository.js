function mapUser(row) {
  if (!row) return null;
  const plain = { ...row };
  return {
    id: Number(plain.id),
    name: plain.name,
    email: plain.email,
    passwordHash: plain.password_hash,
    role: plain.role,
    createdAt: plain.created_at,
  };
}

export function createUserRepository(db) {
  return {
    findByEmail(email) {
      const row = db.prepare('SELECT * FROM users WHERE lower(email) = lower(?)').get(email);
      return mapUser(row);
    },

    findById(id) {
      const row = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(id));
      return mapUser(row);
    },

    create({ name, email, passwordHash, role = 'STAFF' }) {
      const result = db
        .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
        .run(name, email, passwordHash, role);
      return this.findById(Number(result.lastInsertRowid));
    },
  };
}
