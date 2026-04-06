import { useEffect, useState } from "react";
import { Stat } from "../../components/UI";
import {
  getAdminDashboardStats,
  type AdminDashboardStats,
} from "../../services/admin";

interface AdminDashboardProps {
  onNav: (page: "accounts" | "classes" | "departments" | "heads") => void;
}

export default function AdminDashboard({ onNav }: AdminDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminDashboardStats>({
    teachers: 0,
    classes: 0,
    students: 0,
    departments: 0,
    heads_assigned: 0,
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const dashboardStats = await getAdminDashboardStats();
        if (mounted) {
          setStats(dashboardStats);
        }
      } catch {
        if (mounted) {
          setStats({
            teachers: 0,
            classes: 0,
            students: 0,
            departments: 0,
            heads_assigned: 0,
          });
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1100 }}>
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--chef-accent)",
            textTransform: "uppercase",
            letterSpacing: "2px",
            marginBottom: 10,
          }}
        >
          ◎ Admin Core
        </div>
        <h1 style={{ margin: 0, fontSize: 34, letterSpacing: "-1.5px" }}>
          Pilotage académique
        </h1>
        <p style={{ color: "var(--text2)", marginTop: 8 }}>
          Milestone 3 — comptes, classes, départements et chefs de département.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <Stat
          label="Enseignants"
          value={loading ? "…" : stats.teachers}
          accent="var(--chef-accent)"
          sub="Comptes teacher"
        />
        <Stat
          label="Classes"
          value={loading ? "…" : stats.classes}
          accent="var(--ens-accent)"
          sub="Structures actives"
        />
        <Stat
          label="Étudiants"
          value={loading ? "…" : stats.students}
          accent="var(--etu-accent)"
          sub="Comptes student"
        />
        <Stat
          label="Départements"
          value={loading ? "…" : stats.departments}
          accent="var(--chef-accent)"
          sub="Structures académiques"
        />
        <Stat
          label="Chefs assignés"
          value={loading ? "…" : stats.heads_assigned}
          accent="var(--etu-accent)"
          sub="Responsables actifs"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
        }}
      >
        {[
          {
            id: "accounts",
            title: "Comptes",
            desc: "Créer enseignants et étudiants",
          },
          {
            id: "classes",
            title: "Classes",
            desc: "Créer et visualiser les classes",
          },
          {
            id: "departments",
            title: "Départements",
            desc: "Voir la répartition actuelle",
          },
          {
            id: "heads",
            title: "Chefs département",
            desc: "Affectation (phase suivante)",
          },
        ].map((card) => (
          <button
            key={card.id}
            onClick={() =>
              onNav(card.id as "accounts" | "classes" | "departments" | "heads")
            }
            style={{
              textAlign: "left",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
              padding: "16px 18px",
              cursor: "pointer",
              color: "var(--text)",
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6 }}>{card.title}</div>
            <div style={{ color: "var(--text2)", fontSize: 13 }}>
              {card.desc}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
