function mapInvoice(row) {
  if (!row) return null;
  const plain = { ...row };
  return {
    id: Number(plain.id),
    appointmentId: Number(plain.appointment_id),
    patientId: Number(plain.patient_id),
    patientName: plain.patient_name || undefined,
    doctorName: plain.doctor_name || undefined,
    visitType: plain.visit_type || undefined,
    baseAmount: Number(plain.base_amount),
    discountPercent: Number(plain.discount_percent),
    finalAmount: Number(plain.final_amount),
    strategyName: plain.strategy_name,
    status: plain.status,
    paymentMethod: plain.payment_method,
    transactionRef: plain.transaction_ref,
    paidAt: plain.paid_at,
    createdAt: plain.created_at,
  };
}

const INVOICE_SELECT = `
  SELECT
    i.*,
    p.full_name AS patient_name,
    d.full_name AS doctor_name,
    a.visit_type AS visit_type
  FROM invoices i
  JOIN patients p ON p.id = i.patient_id
  JOIN appointments a ON a.id = i.appointment_id
  JOIN doctors d ON d.id = a.doctor_id
`;

export function createInvoiceRepository(db) {
  return {
    findAll() {
      const rows = db.prepare(`${INVOICE_SELECT} ORDER BY i.id DESC`).all();
      return rows.map(mapInvoice);
    },

    findById(id) {
      const row = db.prepare(`${INVOICE_SELECT} WHERE i.id = ?`).get(Number(id));
      return mapInvoice(row);
    },

    findByAppointmentId(appointmentId) {
      const row = db
        .prepare(`${INVOICE_SELECT} WHERE i.appointment_id = ?`)
        .get(Number(appointmentId));
      return mapInvoice(row);
    },

    create({
      appointmentId,
      patientId,
      baseAmount,
      discountPercent = 0,
      finalAmount,
      strategyName,
      status = 'UNPAID',
    }) {
      const result = db
        .prepare(
          `INSERT INTO invoices (appointment_id, patient_id, base_amount, discount_percent, final_amount, strategy_name, status)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          Number(appointmentId),
          Number(patientId),
          Number(baseAmount),
          Number(discountPercent),
          Number(finalAmount),
          strategyName,
          status
        );
      return this.findById(Number(result.lastInsertRowid));
    },

    markPaid(id, { paymentMethod, transactionRef, paidAt }) {
      db.prepare(
        `UPDATE invoices
         SET status = 'PAID', payment_method = ?, transaction_ref = ?, paid_at = ?
         WHERE id = ?`
      ).run(paymentMethod, transactionRef, paidAt, Number(id));
      return this.findById(id);
    },

    summarizeRevenue() {
      const row = db
        .prepare(
          `SELECT
             COALESCE(SUM(CASE WHEN status = 'PAID' THEN final_amount ELSE 0 END), 0) AS total_revenue,
             COALESCE(SUM(CASE WHEN status = 'UNPAID' THEN 1 ELSE 0 END), 0) AS unpaid_count
           FROM invoices`
        )
        .get();
      return {
        totalRevenue: Number(row?.total_revenue || 0),
        unpaidInvoices: Number(row?.unpaid_count || 0),
      };
    },
  };
}
