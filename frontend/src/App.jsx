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

const navConfig = {
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

function renderPage(page, user, onNav) {
  const props = { user, onNav };
  const map = {
    chef: { dashboard: <ChefDashboard {...props} />, sujets: <ChefSujets {...props} />, planning: <ChefPlanning {...props} />, jurys: <ChefJurys {...props} />, forum: <Forum {...props} />, export: <ChefExport {...props} /> },
    enseignant: { dashboard: <EnseignantDashboard {...props} />, planning: <EnseignantPlanning {...props} />, disponibilites: <EnseignantDisponibilites {...props} />, forum: <Forum {...props} /> },
    etudiant: { dashboard: <EtudiantDashboard {...props} />, forum: <Forum {...props} /> },
  };
  return map[user.role]?.[page] || map[user.role]?.dashboard;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [activePage, setActivePage] = useState('dashboard');
  if (!user) return <Login onLogin={u => { setUser(u); setActivePage('dashboard'); }} />;
  return (
    <Shell user={user} nav={navConfig[user.role]} activePage={activePage} onNav={setActivePage} onLogout={() => { setUser(null); setActivePage('dashboard'); }}>
      {renderPage(activePage, user, setActivePage)}
    </Shell>
  );
}
