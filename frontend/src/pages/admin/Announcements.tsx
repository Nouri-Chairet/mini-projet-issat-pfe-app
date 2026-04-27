import { useEffect, useState } from "react";
import { AppUser } from "../../types/app";
import { Btn, Input, Select } from "../../components/UI";
import {
  createDepartmentAnnouncement,
  listDepartmentAnnouncements,
  DepartmentAnnouncement,
} from "../../services/admin";
import axios from "axios";
import { getStoredSession } from "../../services/auth";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000";

function authHeaders() {
  const token = getStoredSession()?.tokens.access;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AdminAnnouncements({ user }: { user: AppUser }) {
  const [announcements, setAnnouncements] = useState<DepartmentAnnouncement[]>(
    [],
  );
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const deptRes = await axios.get(
          `${API_BASE_URL}/api/admin/departments/get/`,
          { headers: authHeaders() },
        );
        setDepartments(deptRes.data.departments || []);

        const annRes = await listDepartmentAnnouncements();
        setAnnouncements(annRes);
      } catch (err) {
        console.error("Failed to load data", err);
      }
    }
    loadData();
  }, []);

  const handleCreate = async () => {
    if (!title || !content || !selectedDept) {
      setFeedback("Veuillez remplir tous les champs.");
      return;
    }
    try {
      const created = await createDepartmentAnnouncement({
        title,
        content,
        department_id: selectedDept,
      });
      setAnnouncements((prev) => [created, ...prev]);
      setTitle("");
      setContent("");
      setFeedback("Annonce publiée !");
    } catch (err) {
      setFeedback("Erreur lors de la publication de l'annonce.");
    }
  };

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1000 }}>
      <h1>Annonces du Département</h1>

      <div
        style={{
          background: "var(--surface)",
          padding: 20,
          borderRadius: 8,
          marginBottom: 24,
          border: "1px solid var(--border)",
        }}
      >
        <h3>Nouvelle Annonce</h3>
        {feedback && (
          <div style={{ color: "var(--primary)", marginBottom: 12 }}>
            {feedback}
          </div>
        )}

        <div style={{ display: "grid", gap: 16 }}>
          <Select
            label="Département"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
          >
            <option value="">Sélectionner un département...</option>
            {departments.map((d: any) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Input
            label="Titre"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div>
            <label
              style={{
                display: "block",
                marginBottom: 6,
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text2)",
              }}
            >
              Contenu
            </label>
            <textarea
              style={{
                width: "100%",
                padding: 10,
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                minHeight: 100,
              }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <Btn onClick={handleCreate}>Publier l'annonce</Btn>
        </div>
      </div>

      <div>
        <h3>Annonces récentes</h3>
        <div style={{ display: "grid", gap: 12 }}>
          {announcements.map((a) => (
            <div
              key={a.id}
              style={{
                background: "var(--surface)",
                padding: 16,
                borderRadius: 8,
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ color: "var(--text2)", fontSize: 12 }}>
                {a.department_name}
              </div>
              <h4 style={{ margin: "8px 0" }}>{a.title}</h4>
              <p style={{ margin: 0 }}>{a.content}</p>
            </div>
          ))}
          {announcements.length === 0 && (
            <div style={{ color: "var(--text2)" }}>Aucune annonce.</div>
          )}
        </div>
      </div>
    </div>
  );
}
