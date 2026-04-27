import { useEffect, useState } from "react";
import { listDepartmentAnnouncements, DepartmentAnnouncement } from "../../services/admin";
import { AppUser } from "../../types/app";
import { Card } from "../../components/UI";

export default function Announcements({ user }: { user: AppUser }) {
  const [announcements, setAnnouncements] = useState<DepartmentAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const annRes = await listDepartmentAnnouncements();
        setAnnouncements(annRes);
      } catch (err) {
        console.error("Failed to load data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1000 }}>
      <h1>Annonces du Département</h1>
      <p style={{ color: "var(--text2)", marginBottom: 24 }}>
        Retrouvez ici toutes les annonces publiées par l'administration pour votre département.
      </p>

      {loading ? (
        <div>Chargement...</div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {announcements.map((a) => (
            <Card key={a.id} style={{ padding: 20 }}>
              <div style={{ color: "var(--primary)", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                {a.department_name}
              </div>
              <h3 style={{ margin: "4px 0 12px 0" }}>{a.title}</h3>
              <div style={{ color: "var(--text)", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                {a.content}
              </div>
              <div style={{ color: "var(--text3)", fontSize: 12, marginTop: 16 }}>
                Publié par {a.author} • {new Date(a.created_at).toLocaleDateString()}
              </div>
            </Card>
          ))}
          {announcements.length === 0 && (
            <div style={{ color: "var(--text2)" }}>Aucune annonce disponible.</div>
          )}
        </div>
      )}
    </div>
  );
}
