import { useEffect, useState } from 'react';
import { Check, Plus, XCircle } from 'lucide-react';
import { apiRequest } from '../api/client';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';

const STATUS_TABS = ['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED'];

function estimateStrategyFee(baseFee, visitType) {
  const fee = Number(baseFee || 0);
  if (visitType === 'FOLLOW_UP') return Math.round(fee * 0.5);
  if (visitType === 'EMERGENCY') return Math.round(fee * 1.5 + 200);
  return Math.round(fee);
}

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    patientId: '',
    doctorId: '',
    visitType: 'STANDARD',
    appointmentDate: '2026-12-01',
    timeSlot: '11:00',
    reason: '',
  });

  async function loadAll(status = statusFilter) {
    try {
      const qs = status && status !== 'ALL' ? `?status=${status}` : '';
      const [apptRes, patRes, docRes] = await Promise.all([
        apiRequest(`/api/appointments${qs}`),
        apiRequest('/api/patients'),
        apiRequest('/api/doctors'),
      ]);
      setAppointments(apptRes.appointments);
      setPatients(patRes.patients);
      setDoctors(docRes.doctors);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadAll('ALL');
  }, []);

  function openBookModal() {
    const firstPatient = patients[0]?.id ? String(patients[0].id) : '';
    const firstAvailableDoc = doctors.find((d) => d.available)?.id;
    setForm({
      patientId: firstPatient,
      doctorId: firstAvailableDoc ? String(firstAvailableDoc) : '',
      visitType: 'STANDARD',
      appointmentDate: '2026-12-01',
      timeSlot: '11:00',
      reason: '',
    });
    setError('');
    setModalOpen(true);
  }

  async function handleBook(e) {
    e.preventDefault();
    setError('');
    try {
      await apiRequest('/api/appointments', {
        method: 'POST',
        body: {
          ...form,
          patientId: Number(form.patientId),
          doctorId: Number(form.doctorId),
        },
      });
      setModalOpen(false);
      await loadAll(statusFilter);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await apiRequest(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        body: { status },
      });
      await loadAll(statusFilter);
    } catch (err) {
      setError(err.message);
    }
  }

  const selectedDoctor = doctors.find((d) => String(d.id) === String(form.doctorId));
  const estimatedFee = selectedDoctor
    ? estimateStrategyFee(selectedDoctor.consultationFee, form.visitType)
    : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Appointments</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Schedule clinic slots using Factory visit types with conflict detection.
          </p>
        </div>
        <button
          type="button"
          data-testid="book-appointment-btn"
          onClick={openBookModal}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-teal-800"
        >
          <Plus className="h-4 w-4" />
          Book Appointment
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setStatusFilter(tab);
              loadAll(tab);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              statusFilter === tab
                ? 'bg-teal-700 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
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
                <th className="px-5 py-3">Patient</th>
                <th className="px-5 py-3">Doctor</th>
                <th className="px-5 py-3">Visit Type &amp; Priority</th>
                <th className="px-5 py-3">Date &amp; Slot</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-500">
                    No appointments found for this filter.
                  </td>
                </tr>
              ) : (
                appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">{appt.patientName}</div>
                      {appt.reason && <div className="text-xs text-slate-500">{appt.reason}</div>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="text-slate-800">{appt.doctorName}</div>
                      <div className="text-xs text-slate-500">{appt.durationMinutes} min</div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <StatusBadge value={appt.visitType} />
                        <StatusBadge value={appt.priority} />
                      </div>
                    </td>
                    <td className="px-5 py-3 tabular-nums text-slate-700">
                      {appt.appointmentDate} · {appt.timeSlot}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge value={appt.status} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      {appt.status === 'SCHEDULED' && (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(appt.id, 'COMPLETED')}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                          >
                            <Check className="h-3 w-3" />
                            Complete
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(appt.id, 'CANCELLED')}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
                          >
                            <XCircle className="h-3 w-3" />
                            Cancel
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
          title="Book Appointment"
          subtitle="Slot type determines priority, duration, and billing strategy."
          onClose={() => setModalOpen(false)}
        >
          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          )}
          <form onSubmit={handleBook} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Patient</label>
                <select
                  required
                  data-testid="appt-patient-select"
                  value={form.patientId}
                  onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-700"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Doctor</label>
                <select
                  required
                  data-testid="appt-doctor-select"
                  value={form.doctorId}
                  onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-700"
                >
                  {doctors
                    .filter((d) => d.available)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName} (৳{d.consultationFee})
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Visit Type</label>
                <select
                  data-testid="appt-type-select"
                  value={form.visitType}
                  onChange={(e) => setForm({ ...form, visitType: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-700"
                >
                  <option value="STANDARD">STANDARD (20m · 1.0x)</option>
                  <option value="FOLLOW_UP">FOLLOW_UP (15m · 0.5x)</option>
                  <option value="EMERGENCY">EMERGENCY (30m · 1.5x + ৳200)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Date</label>
                <input
                  type="date"
                  required
                  data-testid="appt-date-input"
                  value={form.appointmentDate}
                  onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Time Slot</label>
                <input
                  type="text"
                  required
                  data-testid="appt-slot-input"
                  value={form.timeSlot}
                  onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                  placeholder="11:00"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Reason</label>
                <input
                  type="text"
                  data-testid="appt-reason-input"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="Fever & headache"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-700"
                />
              </div>
            </div>

            {estimatedFee !== null && (
              <div className="rounded-lg border border-teal-200 bg-teal-50 px-3.5 py-2.5 text-xs font-medium text-teal-900">
                Estimated Consultation Fee ({form.visitType}):{' '}
                <span className="font-bold tabular-nums">৳{estimatedFee.toLocaleString()}</span>
              </div>
            )}

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
                data-testid="save-appointment-btn"
                className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800"
              >
                Confirm Booking
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
