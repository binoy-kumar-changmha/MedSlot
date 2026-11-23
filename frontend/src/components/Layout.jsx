import {
  Activity,
  CalendarClock,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Stethoscope,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'doctors', label: 'Doctors', icon: Stethoscope },
  { id: 'appointments', label: 'Appointments', icon: CalendarClock },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

export function Layout({ activePage, onNavigate, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-slate-900">MedSlot</div>
            <div className="text-[11px] font-medium text-slate-500">Clinic Manager</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                type="button"
                data-testid={`nav-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-teal-50 text-teal-800'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-slate-100 p-4">
          <a
            href="/api-docs"
            target="_blank"
            rel="noreferrer"
            data-testid="swagger-link"
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800"
          >
            <span>API Docs (Swagger)</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-slate-800">{user?.name}</div>
              <div className="truncate text-[11px] text-slate-500">{user?.role}</div>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Sign out"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-6 py-7">{children}</div>
      </main>
    </div>
  );
}
