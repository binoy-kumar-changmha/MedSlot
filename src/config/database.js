import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { hashPassword } from '../utils/security.js';

const SCHEMA_SQL = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'STAFF',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT DEFAULT '',
    age INTEGER NOT NULL,
    gender TEXT NOT NULL DEFAULT 'Other',
    blood_group TEXT NOT NULL DEFAULT 'O+',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS doctors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    consultation_fee REAL NOT NULL,
    available INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    visit_type TEXT NOT NULL,
    priority TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    appointment_date TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    reason TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'SCHEDULED',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL UNIQUE,
    patient_id INTEGER NOT NULL,
    base_amount REAL NOT NULL,
    discount_percent REAL NOT NULL DEFAULT 0,
    final_amount REAL NOT NULL,
    strategy_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'UNPAID',
    payment_method TEXT DEFAULT NULL,
    transaction_ref TEXT DEFAULT NULL,
    paid_at TEXT DEFAULT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE CASCADE,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
  );
`;

/**
 * Opens or initializes a SQLite database with the MedSlot relational schema.
 */
export function createDatabase(dbPath = path.resolve(process.cwd(), 'data/medslot.db')) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
  const db = new DatabaseSync(dbPath);
  db.exec(SCHEMA_SQL);
  return db;
}

/**
 * Populates clean clinic demo records idempotently when the database has no users yet.
 */
export function seedDemoData(db) {
  const existing = db.prepare('SELECT COUNT(*) AS count FROM users').get();
  if (Number(existing?.count || 0) > 0) {
    return false;
  }

  db.prepare(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
  ).run('Dr. Nafisa Rahman', 'admin@medslot.local', hashPassword('admin123'), 'ADMIN');

  const insertDoctor = db.prepare(
    'INSERT INTO doctors (full_name, specialty, consultation_fee, available) VALUES (?, ?, ?, ?)'
  );
  const d1 = Number(insertDoctor.run('Dr. Tariq Hasan', 'General Medicine', 800, 1).lastInsertRowid);
  const d2 = Number(insertDoctor.run('Dr. Sabrina Islam', 'Cardiology', 1200, 1).lastInsertRowid);
  insertDoctor.run('Dr. Mahmudul Karim', 'Pediatrics', 900, 1);

  const insertPatient = db.prepare(
    'INSERT INTO patients (full_name, phone, email, age, gender, blood_group) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const p1 = Number(insertPatient.run('Tanvir Ahmed', '01711000101', 'tanvir@example.com', 34, 'Male', 'A+').lastInsertRowid);
  const p2 = Number(insertPatient.run('Nusrat Jahan', '01711000202', 'nusrat@example.com', 28, 'Female', 'B+').lastInsertRowid);
  const p3 = Number(insertPatient.run('Rafiqul Islam', '01711000303', 'rafiq@example.com', 52, 'Male', 'O+').lastInsertRowid);

  const insertAppt = db.prepare(
    `INSERT INTO appointments (patient_id, doctor_id, visit_type, priority, duration_minutes, appointment_date, time_slot, reason, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const a1 = Number(
    insertAppt.run(p1, d1, 'STANDARD', 'NORMAL', 20, '2026-11-24', '09:30', 'Seasonal fever checkup', 'COMPLETED').lastInsertRowid
  );
  const a2 = Number(
    insertAppt.run(p2, d2, 'FOLLOW_UP', 'LOW', 15, '2026-11-25', '10:30', 'ECG report follow-up', 'SCHEDULED').lastInsertRowid
  );
  insertAppt.run(p3, d1, 'EMERGENCY', 'URGENT', 30, '2026-11-25', '11:30', 'Acute chest discomfort triage', 'SCHEDULED');

  const insertInvoice = db.prepare(
    `INSERT INTO invoices (appointment_id, patient_id, base_amount, discount_percent, final_amount, strategy_name, status, payment_method, transaction_ref, paid_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insertInvoice.run(
    a1,
    p1,
    800,
    0,
    800,
    'STANDARD',
    'PAID',
    'CARD',
    'BANK-INV-1-SEED01',
    '2026-11-24T09:55:00.000Z'
  );
  insertInvoice.run(a2, p2, 1200, 0, 600, 'FOLLOW_UP', 'UNPAID', null, null, null);

  return true;
}
