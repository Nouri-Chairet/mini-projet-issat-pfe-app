import { useState } from "react";
import { sujets as initialSujets, enseignants } from "../../data/mockData";
import {
  StatusTag,
  Avatar,
  Btn,
  Input,
  Select,
  Modal,
} from "../../components/UI";
import type { Sujet, TopicStatus } from "../../types/app";

const A = "var(--chef-accent)";

interface SujetForm {
  id?: number;
  titre: string;
  etudiantName: string;
  etudiantEmail: string;
  encadreurId: number;
  statut: TopicStatus;
}

export default function ChefSujets() {
  const [sujets, setSujets] = useState<Sujet[]>(initialSujets);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"tous" | TopicStatus>("tous");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [form, setForm] = useState<SujetForm>({
    titre: "",
    etudiantName: "",
    etudiantEmail: "",
    encadreurId: enseignants[0].id,
    statut: "en attente",
  });

  const filtered = sujets.filter((sujet) => {
    const query = search.toLowerCase();
    return (
      (filter === "tous" || sujet.statut === filter) &&
      (sujet.titre.toLowerCase().includes(query) ||
        sujet.etudiant.name.toLowerCase().includes(query))
    );
  });

  const openAdd = () => {
    setForm({
      titre: "",
      etudiantName: "",
      etudiantEmail: "",
      encadreurId: enseignants[0].id,
      statut: "en attente",
    });
    setModal("add");
  };

  const openEdit = (sujet: Sujet) => {
    setForm({
      id: sujet.id,
      titre: sujet.titre,
      etudiantName: sujet.etudiant.name,
      etudiantEmail: sujet.etudiant.email,
      encadreurId:
        enseignants.find((ens) => ens.name === sujet.encadreur.name)?.id ??
        enseignants[0].id,
      statut: sujet.statut,
    });
    setModal("edit");
  };

  const handleSave = () => {
    const encadreur =
      enseignants.find((ens) => ens.id === Number(form.encadreurId)) ??
      enseignants[0];
    const initials = form.etudiantName
      .split(" ")
      .filter(Boolean)
      .map((name) => name[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    if (modal === "add") {
      const createdSujet: Sujet = {
        id: Date.now(),
        titre: form.titre,
        etudiant: {
          name: form.etudiantName,
          email: form.etudiantEmail,
          avatar: initials,
        },
        encadreur: {
          id: encadreur.id,
          name: encadreur.name,
          avatar: encadreur.avatar,
        },
        statut: form.statut,
        jury: [],
        datePresentation: null,
        heure: null,
        salle: null,
      };
      setSujets((prev) => [...prev, createdSujet]);
    } else if (form.id !== undefined) {
      setSujets((prev) =>
        prev.map((sujet) =>
          sujet.id === form.id
            ? {
                ...sujet,
                titre: form.titre,
                etudiant: {
                  ...sujet.etudiant,
                  name: form.etudiantName,
                  email: form.etudiantEmail,
                  avatar: initials,
                },
                encadreur: {
                  id: encadreur.id,
                  name: encadreur.name,
                  avatar: encadreur.avatar,
                },
                statut: form.statut,
              }
            : sujet,
        ),
      );
    }

    setModal(null);
  };

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1100 }}>
      <div
        className="fu"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 32,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: A,
              textTransform: "uppercase",
              letterSpacing: "2px",
              marginBottom: 8,
            }}
          >
            ◈ Gestion
          </div>
          <h1
            style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-1.5px" }}
          >
            Sujets{" "}
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                color: A,
                fontWeight: 400,
              }}
            >
              PFE
            </span>
          </h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn accent={A} variant="ghost">
            ↑ Importer Excel
          </Btn>
          <Btn accent={A} onClick={openAdd}>
            + Nouveau sujet
          </Btn>
        </div>
      </div>

      <div
        className="fu1"
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 20,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
          <span
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text3)",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
            }}
          >
            ⌕
          </span>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
            }}
            placeholder="Rechercher…"
            style={{
              width: "100%",
              padding: "10px 14px 10px 38px",
              background: "var(--surface)",
              border: "1px solid var(--border2)",
              borderRadius: "var(--r-md)",
              color: "var(--text)",
              outline: "none",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {(["tous", "en attente", "planifié", "validé"] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => {
                  setFilter(status);
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 40,
                  border: `1px solid ${filter === status ? `${A}60` : "var(--border)"}`,
                  background:
                    filter === status ? "var(--chef-dim)" : "transparent",
                  color: filter === status ? A : "var(--text2)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                }}
              >
                {status}
              </button>
            ),
          )}
        </div>
      </div>

      <div
        className="fu2"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-xl)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1fr 120px 100px",
            padding: "10px 22px",
            borderBottom: "1px solid var(--border)",
            gap: 16,
          }}
        >
          {["Sujet / Étudiant", "Encadreur", "Date", "Statut", ""].map(
            (header) => (
              <div
                key={header}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  color: "var(--text3)",
                }}
              >
                {header}
              </div>
            ),
          )}
        </div>
        {filtered.map((sujet, index) => (
          <div
            key={sujet.id}
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 120px 100px",
              padding: "16px 22px",
              gap: 16,
              alignItems: "center",
              borderBottom:
                index < filtered.length - 1
                  ? "1px solid var(--border)"
                  : "none",
              cursor: "pointer",
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                minWidth: 0,
              }}
            >
              <Avatar initials={sujet.etudiant.avatar} accent={A} size={34} />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {sujet.titre}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--text2)",
                    marginTop: 2,
                  }}
                >
                  {sujet.etudiant.name}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Avatar
                initials={sujet.encadreur.avatar}
                accent="var(--ens-accent)"
                size={26}
              />
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text2)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {sujet.encadreur.name}
              </span>
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: sujet.datePresentation ? "var(--text)" : "var(--text3)",
              }}
            >
              {sujet.datePresentation
                ? new Date(sujet.datePresentation).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })
                : "—"}
            </div>
            <StatusTag statut={sujet.statut} />
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={() => {
                  openEdit(sujet);
                }}
                style={{
                  padding: "6px 10px",
                  background: "var(--bg2)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--text2)",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                Éditer
              </button>
              <button
                onClick={() => {
                  setSujets((prev) =>
                    prev.filter((row) => row.id !== sujet.id),
                  );
                }}
                style={{
                  padding: "6px 8px",
                  background: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--danger)",
                  cursor: "pointer",
                  fontSize: 12,
                }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div
            style={{
              padding: "48px",
              textAlign: "center",
              color: "var(--text3)",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
            }}
          >
            Aucun résultat
          </div>
        )}
      </div>

      {modal && (
        <Modal
          title={modal === "add" ? "Nouveau sujet PFE" : "Modifier le sujet"}
          onClose={() => setModal(null)}
          accent={A}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input
              label="Titre du sujet"
              accent={A}
              value={form.titre}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, titre: e.target.value }));
              }}
              placeholder="Ex: Système IA pour..."
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <Input
                label="Nom de l'étudiant"
                accent={A}
                value={form.etudiantName}
                onChange={(e) => {
                  setForm((prev) => ({
                    ...prev,
                    etudiantName: e.target.value,
                  }));
                }}
                placeholder="Prénom Nom"
              />
              <Input
                label="Email étudiant"
                accent={A}
                value={form.etudiantEmail}
                onChange={(e) => {
                  setForm((prev) => ({
                    ...prev,
                    etudiantEmail: e.target.value,
                  }));
                }}
                placeholder="email@univ.tn"
              />
            </div>
            <Select
              label="Encadreur"
              value={form.encadreurId}
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  encadreurId: Number(e.target.value),
                }));
              }}
            >
              {enseignants.map((enseignant) => (
                <option key={enseignant.id} value={enseignant.id}>
                  {enseignant.name}
                </option>
              ))}
            </Select>
            <Select
              label="Statut"
              value={form.statut}
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  statut: e.target.value as TopicStatus,
                }));
              }}
            >
              <option value="en attente">En attente</option>
              <option value="planifié">Planifié</option>
              <option value="validé">Validé</option>
            </Select>
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              marginTop: 22,
              justifyContent: "flex-end",
            }}
          >
            <Btn onClick={() => setModal(null)} variant="muted">
              Annuler
            </Btn>
            <Btn onClick={handleSave} accent={A}>
              {modal === "add" ? "Créer" : "Sauvegarder"}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
