import { useEffect, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { apiRequest } from '../api/client';
import { Modal } from '../components/Modal';

const EMPTY_FORM = {
  fullName: '',
  phone: '',
  email: '',
  age: '25',
  gender: 'Female',
  bloodGroup: 'O+',
};

export function PatientsPage() {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  async function loadPatients(query = search) {
    try {
      const qs = query ? `?search=${encodeURIComponent(query)}` : '';
      const res = await apiRequest(`/api/patients${qs}`);
      setPatients(res.patients);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadPatients('');
  }, []);

  function openCreateModal() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setModalOpen(true);
  }

  function openEditModal(patient) {
    setEditingId(patient.id);
    setForm({
      fullName: patient.fullName,
      phone: patient.phone,
      email: patient.email || '',
      age: String(patient.age),
      gender: patient.gender || 'Other',
      bloodGroup: patient.bloodGroup || 'O+',
    });
    setError('');
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...form, age: Number(form.age) };
      if (editingId) {
        await apiRequest(`/api/patients/${editingId}`, { method: 'PUT', body: payload });
      } else {
        await apiRequest('/api/patients', { method: 'POST', body: payload });
      }
      setModalOpen(false);
      await loadPatients(search);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    try {
      await apiRequest(`/api/patients/${id}`, { method: 'DELETE' });
      await loadPatients(search);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Patients</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Register, search, and maintain patient contact profiles.
          </p>
        </div>
        <button
          type="button"
          data-testid="add-patient-btn"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-teal-800"
        >
          <Plus className="h-4 w-4" />
          Add Patient
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          data-testid="patient-search-input"
          value={search}
          onChange={(e) => {
            const val = e.target.value;
            setSearch(val);
            loadPatients(val);
          }}
          placeholder="Search by name or phone..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
        />
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
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Phone</th>
                <th className="px-5 py-3">Age / Gender</th>
                <th className="px-5 py-3">Blood Group</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-slate-500">
                    No matching patients found.
                  </td>
                </tr>
              ) : (
                patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-900">{p.fullName}</div>
                      {p.email && <div className="text-xs text-slate-500">{p.email}</div>}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-slate-700">{p.phone}</td>
                    <td className="px-5 py-3 text-slate-600">
                      {p.age} yrs · {p.gender}
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded bg-rose-50 px-2 py-0.5 text-xs font-semibold text-rose-700">
                        {p.bloodGroup}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
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
          title={editingId ? 'Edit Patient' : 'Register Patient'}
          subtitle="Stored persistently in SQLite clinic database."
          onClose={() => setModalOpen(false)}
        >
          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          )}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  data-testid="patient-name-input"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Farhana Akter"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Phone</label>
                <input
                  type="text"
                  required
                  data-testid="patient-phone-input"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="01711000999"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  data-testid="patient-email-input"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="farhana@example.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Age</label>
                <input
                  type="number"
                  min={0}
                  max={130}
                  required
                  data-testid="patient-age-input"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Gender</label>
                <select
                  data-testid="patient-gender-select"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-700"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Blood Group</label>
                <select
                  data-testid="patient-blood-select"
                  value={form.bloodGroup}
                  onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-700"
                >
                  {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
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
                data-testid="save-patient-btn"
                className="rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800"
              >
                {editingId ? 'Save Changes' : 'Save Patient'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
