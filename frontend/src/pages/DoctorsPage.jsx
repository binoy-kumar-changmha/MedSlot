import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { apiRequest } from '../api/client';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';

export function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ fullName: '', specialty: '', consultationFee: '800' });
  const [error, setError] = useState('');

  async function loadDoctors(specialty = specialtyFilter) {
    try {
      const qs = specialty ? `?specialty=${encodeURIComponent(specialty)}` : '';
      const res = await apiRequest(`/api/doctors${qs}`);
      setDoctors(res.doctors);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadDoctors('');
  }, []);

  const specialties = Array.from(new Set(doctors.map((d) => d.specialty)));

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      await apiRequest('/api/doctors', {
        method: 'POST',
        body: { ...form, consultationFee: Number(form.consultationFee) },
      });
      setModalOpen(false);
      setForm({ fullName: '', specialty: '', consultationFee: '800' });
      await loadDoctors(specialtyFilter);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggle(id) {
    try {
      await apiRequest(`/api/doctors/${id}/availability`, { method: 'PATCH' });
      await loadDoctors(specialtyFilter);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Doctors</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage clinic specialists, base consultation fees, and shift availability.
          </p>
        </div>
        <button
          type="button"
          data-testid="add-doctor-btn"
          onClick={() => {
            setError('');
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-teal-800"
        >
          <Plus className="h-4 w-4" />
          Add Doctor
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            setSpecialtyFilter('');
            loadDoctors('');
          }}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            specialtyFilter === ''
              ? 'bg-teal-700 text-white'
              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          All Specialties
        </button>
        {specialties.map((spec) => (
          <button
            key={spec}
            type="button"
            onClick={() => {
              setSpecialtyFilter(spec);
              loadDoctors(spec);
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              specialtyFilter === spec
                ? 'bg-teal-700 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {spec}
          </button>
        ))}
      </div>

      {error && !modalOpen && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {doctors.map((doc) => (
          <div
            key={doc.id}
            className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{doc.fullName}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{doc.specialty}</p>
                </div>
                <StatusBadge value={doc.available ? 'AVAILABLE' : 'UNAVAILABLE'} />
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-lg font-bold tabular-nums text-slate-900">
                  ৳{doc.consultationFee.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500">base fee</span>
              </div>
            </div>

            <div className="mt-5 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => handleToggle(doc.id)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
              >
                {doc.available ? 'Mark Unavailable' : 'Mark Available'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <Modal
          title="Add Doctor"
          subtitle="Available physicians appear in appointment booking."
          onClose={() => setModalOpen(false)}
        >
          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Full Name</label>
              <input
                type="text"
                required
                data-testid="doctor-name-input"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Dr. Kamrul Hasan"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Specialty</label>
              <input
                type="text"
                required
                data-testid="doctor-specialty-input"
                value={form.specialty}
                onChange={(e) => setForm({ ...form, specialty: e.target.value })}
                placeholder="Dermatology"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-700"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Base Consultation Fee (BDT)
              </label>
              <input
                type="number"
                min={0}
                required
                data-testid="doctor-fee-input"
                value={form.consultationFee}
                onChange={(e) => setForm({ ...form, consultationFee: e.target.value })}
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
                data-testid="save-doctor-btn"
                className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800"
              >
                Save Doctor
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
