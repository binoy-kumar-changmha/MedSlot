import { useState } from 'react';
import { Layout } from './components/Layout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppointmentsPage } from './pages/AppointmentsPage';
import { BillingPage } from './pages/BillingPage';
import { DashboardPage } from './pages/DashboardPage';
import { DoctorsPage } from './pages/DoctorsPage';
import { LoginPage } from './pages/LoginPage';
import { PatientsPage } from './pages/PatientsPage';

function ClinicPortal() {
  const { user, loading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-500">
        Loading MedSlot...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {activePage === 'dashboard' && <DashboardPage onNavigate={setActivePage} />}
      {activePage === 'patients' && <PatientsPage />}
      {activePage === 'doctors' && <DoctorsPage />}
      {activePage === 'appointments' && <AppointmentsPage />}
      {activePage === 'billing' && <BillingPage />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ClinicPortal />
    </AuthProvider>
  );
}
