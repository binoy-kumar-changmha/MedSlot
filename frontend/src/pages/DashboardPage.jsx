import { useEffect, useState } from 'react';
import { CalendarClock, CreditCard, Stethoscope, Users } from 'lucide-react';
import { apiRequest } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';

export function DashboardPage({ onNavigate }) {
  const [summary, setSummary] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      apiRequest('/api/billing/summary'),
      apiRequest('/api/appointments?status=SCHEDULED'),
    ])
      .then(([sumRes, apptRes]) => {
        setSummary(sumRes.summary);
        setAppointments(apptRes.appointments.slice(0, 6));
      })
      .catch((err) => setError(err.message));
  }, []);

  const kpis = [
    {
      label: 'Total Patients',
      value: summary?.totalPatients ?? '—',
      icon: Users,
      testId: 'kpi-patients',
    },
    {
      label: 'Active Doctors',
      value: summary?.availableDoctors ?? '—',
      icon: Stethoscope,
      testId: 'kpi-doctors',
    },
    {
      label: 'Scheduled Visits',
      value: summary?.scheduledAppointments ?? '—',
      icon: CalendarClock,
      testId: 'kpi-scheduled',
    },
    {
      label: 'Collected Revenue',
      value: summary ? `৳${summary.totalRevenue.toLocaleString()}` : '—',
      sub: summary ? `${summary.unpaidInvoices} unpaid` : '',
      icon: CreditCard,
      testId: 'kpi-revenue',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Clinic Overview</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Live queue, physician availability, and collected billing metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('patients')}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Manage Patients
          </button>
          <button
            type="button"
            onClick={() => onNavigate('appointments')}
            className="rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-teal-800"
          >
            Book Appointment
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              data-testid={item.testId}
              className="rounded-xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{item.label}</span>
                <Icon className="h-4 w-4 text-teal-700" />
              </div>
              <div className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
                {item.value}
              </div>
              {item.sub && <div className="mt-1 text-xs text-amber-700">{item.sub}</div>}
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-900">Upcoming Scheduled Visits</h2>
          <button
            type="button"
            onClick={() => onNavigate('appointments')}
            className="text-xs font-medium text-teal-700 hover:text-teal-800"
          >
            View all →
          </button>
        </div>

        {appointments.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            No scheduled appointments in the queue right now.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/70 text-xs font-medium text-slate-500">
                <tr>
                  <th className="px-5 py-3">Patient</th>
                  <th className="px-5 py-3">Doctor</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Date &amp; Slot</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3 font-medium text-slate-900">{appt.patientName}</td>
                    <td className="px-5 py-3 text-slate-600">{appt.doctorName}</td>
                    <td className="px-5 py-3">
                      <StatusBadge value={appt.visitType} />
                    </td>
                    <td className="px-5 py-3 tabular-nums text-slate-600">
                      {appt.appointmentDate} · {appt.timeSlot}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge value={appt.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
