import AdminAnnouncements from "./pages/admin/Announcements";
import Announcements from "./pages/shared/Announcements";
import React, { useMemo, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Login from "./pages/Login";
import Shell from "./components/Shell";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminAccounts from "./pages/admin/Accounts";
import AdminAccountImport from "./pages/admin/AccountImport";
import AdminClasses from "./pages/admin/Classes";
import AdminDepartments from "./pages/admin/Departments";
import AdminTimetable from "./pages/admin/Timetable";
import AdminPfeScheduler from "./pages/admin/PfeScheduler";
import AdminPfeSessions from "./pages/admin/PfeSessions";
import EnseignantDashboard from "./pages/enseignant/Dashboard";
import EnseignantPlanning from "./pages/enseignant/Planning";
import EnseignantDisponibilites from "./pages/enseignant/Disponibilites";
import EnseignantEmploi from "./pages/enseignant/Emploi";
import Forum from "./pages/shared/Forum";
import EtudiantDashboard from "./pages/etudiant/Dashboard";
import EtudiantEmploi from "./pages/etudiant/Emploi";
import {
  clearSession,
  getStoredSession,
  loginWithEmailPassword,
  requestPasswordReset,
} from "./services/auth";
import type { AppUser, NavItem, PageId } from "./types/app";

type RoleRoute = "admin" | "teacher" | "student";

const roleToPath: Record<AppUser["role"], RoleRoute> = {
  chef: "admin",
  enseignant: "teacher",
  etudiant: "student",
};

const pathToRole: Record<RoleRoute, AppUser["role"]> = {
  admin: "chef",
  teacher: "enseignant",
  student: "etudiant",
};

const getNavConfig = (user: AppUser): Record<AppUser["role"], NavItem[]> => ({
  chef: [
    { id: "dashboard", label: "Admin Dashboard", icon: "▦" },
    { id: "timetable", label: "Emploi du temps", icon: "▧" },
    { id: "announcements", label: "Annonces", icon: "▤" },
    { id: "pfe-sessions", label: "Manage Campaigns", icon: "◉" },
    { id: "accounts", label: "Comptes", icon: "◎" },
    { id: "import", label: "Import Excel", icon: "⬆" },
    { id: "classes", label: "Classes", icon: "▤" },
    { id: "departments", label: "Départements", icon: "◆" },
    { id: "heads", label: "Chefs département", icon: "◈" },
  ],
  enseignant: [
    { id: "dashboard", label: "Mon espace", icon: "▦" },
    { id: "announcements", label: "Annonces", icon: "▤" },
    { id: "emploi", label: "Emploi du temps", icon: "▧" },
    { id: "planning", label: "Mes soutenances PFE", icon: "▤" },
    { id: "disponibilites", label: "Disponibilités PFE", icon: "◌" },
    { id: "forum", label: "Forum PFE", icon: "◎", badge: 1 },
  ],
  etudiant: [
    { id: "dashboard", label: "Mon PFE", icon: "◉" },
    { id: "announcements", label: "Annonces", icon: "▤" },
    { id: "emploi", label: "Emploi du temps", icon: "▧" },
    { id: "forum", label: "Forum PFE", icon: "◎" },
  ],
});

function renderPage(
  page: PageId,
  user: AppUser,
  onNav: (page: PageId) => void,
) {
  const props = { user, onNav } as any;
  const map: Record<
    AppUser["role"],
    Partial<Record<PageId, React.ReactElement>>
  > = {
    chef: {
      dashboard: <AdminDashboard {...props} />,
      timetable: <AdminTimetable />,
      announcements: <AdminAnnouncements {...props} />,
      "pfe-sessions": <AdminPfeSessions />,
      "pfe-scheduler": <AdminPfeScheduler />,
      accounts: <AdminAccounts {...props} />,
      import: <AdminAccountImport />,
      classes: <AdminClasses {...props} />,
      departments: <AdminDepartments {...props} mode="departments" />,
      heads: <AdminDepartments {...props} mode="heads" />,
    },
    enseignant: {
      dashboard: <EnseignantDashboard {...props} />,
      announcements: <Announcements {...props} />,
      emploi: <EnseignantEmploi {...props} />,
      planning: <EnseignantPlanning {...props} />,
      disponibilites: <EnseignantDisponibilites {...props} />,
      forum: <Forum {...props} />,
    },
    etudiant: {
      dashboard: <EtudiantDashboard {...props} />,
      announcements: <Announcements {...props} />,
      emploi: <EtudiantEmploi />,
      forum: <Forum {...props} />,
    },
  };
  return map[user.role]?.[page] || map[user.role]?.dashboard;
}

function resolvePageFromPath(pathname: string, basePath: string): PageId {
  const relative = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length).replace(/^\//, "")
    : "";
  const candidate = (relative || "dashboard") as PageId;
  return candidate;
}

function UnauthorizedPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--bg)",
        color: "var(--text)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ marginBottom: 8 }}>Accès refusé</h1>
        <p style={{ color: "var(--text2)", margin: 0 }}>
          Vous n&apos;avez pas les droits pour accéder à cette page.
        </p>
      </div>
    </div>
  );
}

interface RolePortalProps {
  user: AppUser;
  onLogout: () => void;
  routeRole: RoleRoute;
}

function RolePortal({ user, onLogout, routeRole }: RolePortalProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const expectedRole = pathToRole[routeRole];

  if (user.role !== expectedRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  const basePath = `/${routeRole}`;
  const activePage = resolvePageFromPath(location.pathname, basePath);
  const roleNav = getNavConfig(user)[user.role] ?? [];
  const allowedIds = new Set(roleNav.map((item) => item.id));

  if (!allowedIds.has(activePage)) {
    return <Navigate to={`${basePath}/dashboard`} replace />;
  }

  const onNav = (page: PageId) => {
    navigate(`${basePath}/${page}`);
  };

  return (
    <Shell
      user={user}
      nav={roleNav}
      activePage={activePage}
      onNav={onNav}
      onLogout={onLogout}
    >
      {renderPage(activePage, user, onNav)}
    </Shell>
  );
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<AppUser | null>(
    getStoredSession()?.user ?? null,
  );

  const userHomePath = useMemo(() => {
    if (!user) {
      return "/login";
    }
    return `/${roleToPath[user.role]}/dashboard`;
  }, [user]);

  const handleLogin = async (email: string, password: string) => {
    const session = await loginWithEmailPassword(email, password);
    setUser(session.user);
    navigate(`/${roleToPath[session.user.role]}/dashboard`, { replace: true });
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    navigate("/login", { replace: true });
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? (
            <Navigate to={userHomePath} replace />
          ) : (
            <Login
              onLogin={handleLogin}
              onForgotPassword={requestPasswordReset}
            />
          )
        }
      />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route
        path="/admin/*"
        element={
          user ? (
            <RolePortal user={user} onLogout={handleLogout} routeRole="admin" />
          ) : (
            <Navigate to="/login" replace state={{ from: location.pathname }} />
          )
        }
      />
      <Route
        path="/teacher/*"
        element={
          user ? (
            <RolePortal
              user={user}
              onLogout={handleLogout}
              routeRole="teacher"
            />
          ) : (
            <Navigate to="/login" replace state={{ from: location.pathname }} />
          )
        }
      />
      <Route
        path="/student/*"
        element={
          user ? (
            <RolePortal
              user={user}
              onLogout={handleLogout}
              routeRole="student"
            />
          ) : (
            <Navigate to="/login" replace state={{ from: location.pathname }} />
          )
        }
      />

      <Route path="/" element={<Navigate to={userHomePath} replace />} />
      <Route path="*" element={<Navigate to={userHomePath} replace />} />
    </Routes>
  );
}
