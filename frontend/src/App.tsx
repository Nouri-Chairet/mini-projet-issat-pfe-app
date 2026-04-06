import React, { useState } from 'react';
import Login from './pages/Login';
import Shell from './components/Shell';
import ChefDashboard from './pages/chef/Dashboard';
import ChefSujets from './pages/chef/Sujets';
import ChefPlanning from './pages/chef/Planning';
import ChefJurys from './pages/chef/Jurys';
import ChefExport from './pages/chef/Export';
import EnseignantDashboard from './pages/enseignant/Dashboard';
import EnseignantPlanning from './pages/enseignant/Planning';
import EnseignantDisponibilites from './pages/enseignant/Disponibilites';
import Forum from './pages/shared/Forum';
import EtudiantDashboard from './pages/etudiant/Dashboard';
import { clearSession, getStoredSession, loginWithEmailPassword, requestPasswordReset } from './services/auth';
import type { AppUser, NavItem, PageId } from './types/app';

const navConfig: Record<AppUser['role'], NavItem[]> = {
  chef: [
    { id: 'dashboard', label: "Vue d'ensemble", icon: '▦' },
    { id: 'sujets', label: 'Sujets PFE', icon: '▤' },
    { id: 'planning', label: 'Planning', icon: '◈' },
    { id: 'jurys', label: 'Jurys', icon: '◆' },
    { id: 'forum', label: 'Forum PFE', icon: '◎', badge: 2 },
    { id: 'export', label: 'Export & Rapports', icon: '↓' },
  ],
  enseignant: [
    { id: 'dashboard', label: 'Mon espace', icon: '▦' },
    { id: 'planning', label: 'Mon planning', icon: '▤' },
    { id: 'disponibilites', label: 'Disponibilités', icon: '◌' },
    { id: 'forum', label: 'Forum PFE', icon: '◎', badge: 1 },
  ],
  etudiant: [
    { id: 'dashboard', label: 'Mon PFE', icon: '◉' },
    { id: 'forum', label: 'Forum PFE', icon: '◎' },
  ],
};

function renderPage(page: PageId, user: AppUser, onNav: (page: PageId) => void) {
  const props = { user, onNav } as any;
  const map: Record<AppUser['role'], Partial<Record<PageId, React.ReactElement>>> = {
    chef: { dashboard: <ChefDashboard {...props} />, sujets: <ChefSujets {...props} />, planning: <ChefPlanning {...props} />, jurys: <ChefJurys {...props} />, forum: <Forum {...props} />, export: <ChefExport {...props} /> },
    enseignant: { dashboard: <EnseignantDashboard {...props} />, planning: <EnseignantPlanning {...props} />, disponibilites: <EnseignantDisponibilites {...props} />, forum: <Forum {...props} /> },
    etudiant: { dashboard: <EtudiantDashboard {...props} />, forum: <Forum {...props} /> },
  };
  return map[user.role]?.[page] || map[user.role]?.dashboard;
}

export default function App() {
  const [user, setUser] = useState<AppUser | null>(getStoredSession()?.user ?? null);
  const [activePage, setActivePage] = useState<PageId>('dashboard');

  const handleLogin = async (email: string, password: string) => {
    const session = await loginWithEmailPassword(email, password);
    setUser(session.user);
    setActivePage('dashboard');
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setActivePage('dashboard');
  };

  if (!user) {
    return <Login onLogin={handleLogin} onForgotPassword={requestPasswordReset} />;
  }

  return (
    <Shell user={user} nav={navConfig[user.role]} activePage={activePage} onNav={setActivePage} onLogout={handleLogout}>
      {renderPage(activePage, user, setActivePage)}
    </Shell>
  );
}
