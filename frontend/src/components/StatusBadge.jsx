const BADGE_STYLES = {
  SCHEDULED: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  CANCELLED: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  STANDARD: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  FOLLOW_UP: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  EMERGENCY: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  PAID: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  UNPAID: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  AVAILABLE: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  UNAVAILABLE: 'bg-slate-100 text-slate-600 ring-slate-500/20',
  URGENT: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  NORMAL: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  LOW: 'bg-teal-50 text-teal-700 ring-teal-600/20',
};

export function StatusBadge({ value }) {
  const key = String(value || '').toUpperCase();
  const classes = BADGE_STYLES[key] || 'bg-slate-100 text-slate-700 ring-slate-500/20';

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${classes}`}
    >
      {key.replaceAll('_', ' ')}
    </span>
  );
}
