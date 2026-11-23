import { useEffect, useState } from 'react';
import { CreditCard, Plus } from 'lucide-react';
import { apiRequest } from '../api/client';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';

export function BillingPage() {
  const [invoices, setInvoices] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [appointmentId, setAppointmentId] = useState('');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [paymentMethods, setPaymentMethods] = useState({});
  const [error, setError] = useState('');

  async function loadBilling() {
    try {
      const [invRes, apptRes, sumRes] = await Promise.all([
        apiRequest('/api/billing/invoices'),
        apiRequest('/api/appointments'),
        apiRequest('/api/billing/summary'),
      ]);
      setInvoices(invRes.invoices);
      setAppointments(apptRes.appointments);
      setSummary(sumRes.summary);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadBilling();
  }, []);

  const billedAppointmentIds = new Set(invoices.map((inv) => inv.appointmentId));
  const billableAppointments = appointments.filter(
    (a) => a.status !== 'CANCELLED' && !billedAppointmentIds.has(a.id)
  );

  function openGenerateModal() {
    setAppointmentId(billableAppointments[0]?.id ? String(billableAppointments[0].id) : '');
    setDiscountPercent('0');
    setError('');
    setModalOpen(true);
  }

  async function handleGenerate(e) {
    e.preventDefault();
    setError('');
    try {
      await apiRequest('/api/billing/invoices', {
        method: 'POST',
        body: {
          appointmentId: Number(appointmentId),
          discountPercent: Number(discountPercent || 0),
        },
      });
      setModalOpen(false);
      await loadBilling();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handlePay(invoiceId) {
    setError('');
    try {
      const method = paymentMethods[invoiceId] || 'CARD';
      await apiRequest(`/api/billing/invoices/${invoiceId}/pay`, {
        method: 'POST',
        body: { method },
      });
      await loadBilling();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Billing &amp; Invoices</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Generate Strategy-calculated invoices and settle via PaymentGatewayAdapter.
          </p>
        </div>
        <button
          type="button"
          data-testid="generate-invoice-btn"
          disabled={billableAppointments.length === 0}
          onClick={openGenerateModal}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-teal-800 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          Generate Invoice
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Collected Revenue</div>
          <div className="mt-1.5 text-2xl font-bold tabular-nums text-teal-700">
            ৳{(summary?.totalRevenue ?? 0).toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-medium text-slate-500">Pending Unpaid Invoices</div>
          <div className="mt-1.5 text-2xl font-bold tabular-nums text-amber-700">
            {summary?.unpaidInvoices ?? 0}
          </div>
        </div>
      </div>

      {error && !modalOpen && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs font-medium text-slate-500">
              <tr>
                <th className="px-5 py-3">Invoice</th>
                <th className="px-5 py-3">Patient &amp; Doctor</th>
                <th className="px-5 py-3">Strategy</th>
                <th className="px-5 py-3">Amount (BDT)</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    No invoices generated yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} data-testid={`invoice-row-${inv.id}`} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-mono text-xs font-semibold text-slate-700">
                      INV-{inv.id}
                    </td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">{inv.patientName}</div>
                      <div className="text-xs text-slate-500">{inv.doctorName}</div>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge value={inv.strategyName} />
                    </td>
                    <td className="px-5 py-3 tabular-nums">
                      <div className="font-semibold text-slate-900">
                        ৳{inv.finalAmount.toLocaleString()}
                      </div>
                      {inv.discountPercent > 0 && (
                        <div className="text-xs text-slate-500">
                          Base ৳{inv.baseAmount} (-{inv.discountPercent}%)
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge value={inv.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      {inv.status === 'PAID' ? (
                        <div className="text-xs text-slate-500">
                          <div className="font-mono font-medium text-slate-700">
                            {inv.transactionRef}
                          </div>
                          <div>{inv.paymentMethod}</div>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <select
                            aria-label="Payment method"
                            value={paymentMethods[inv.id] || 'CARD'}
                            onChange={(e) =>
                              setPaymentMethods({ ...paymentMethods, [inv.id]: e.target.value })
                            }
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-teal-700"
                          >
                            <option value="CARD">CARD</option>
                            <option value="BKASH">BKASH</option>
                            <option value="CASH">CASH</option>
                          </select>
                          <button
                            type="button"
                            data-testid="pay-invoice-btn"
                            onClick={() => handlePay(inv.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-teal-700 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-teal-800"
                          >
                            <CreditCard className="h-3.5 w-3.5" />
                            Pay Now
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <Modal
          title="Generate Invoice"
          subtitle="FeeCalculator automatically applies Standard, Follow-Up, or Emergency strategy."
          onClose={() => setModalOpen(false)}
        >
          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          )}
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Appointment</label>
              <select
                required
                data-testid="invoice-appointment-select"
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-700"
              >
                {billableAppointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    #{a.id} · {a.patientName} with {a.doctorName} ({a.visitType})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Discount Percentage (0–100)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                data-testid="invoice-discount-input"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-700"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                data-testid="save-invoice-btn"
                className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800"
              >
                Create Invoice
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
