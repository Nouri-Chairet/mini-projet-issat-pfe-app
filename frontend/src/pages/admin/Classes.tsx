import { useEffect, useState } from "react";
import { Btn, Input, Select } from "../../components/UI";
import {
  createAdminClasses,
  getAdminClasses,
  type AdminClass,
} from "../../services/admin";

const sectionOptions = [
  "Prépa",
  "L-LSI",
  "L-Mécanique",
  "L-Energie",
  "Cycle Ingénieur",
];

export default function AdminClasses() {
  const [items, setItems] = useState<AdminClass[]>([]);
  const [feedback, setFeedback] = useState("");
  const [form, setForm] = useState({
    level: 1,
    section: sectionOptions[0],
    nb: 1,
  });

  const load = async () => {
    try {
      const classes = await getAdminClasses();
      setItems(classes);
    } catch {
      setFeedback("Erreur lors du chargement des classes.");
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async () => {
    setFeedback("");
    try {
      await createAdminClasses({
        level: Number(form.level),
        section: form.section,
        nb: Number(form.nb),
      });
      setFeedback("Classes créées avec succès.");
      await load();
    } catch {
      setFeedback("Erreur lors de la création des classes.");
    }
  };

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1000 }}>
      <h1 style={{ marginTop: 0, marginBottom: 8 }}>Gestion des classes</h1>
      <p style={{ color: "var(--text2)", marginTop: 0, marginBottom: 20 }}>
        Milestone 3 — création et visualisation des classes (M3-07, M3-08).
      </p>

      {feedback ? (
        <div
          style={{
            marginBottom: 14,
            border: "1px solid var(--border)",
            borderRadius: "var(--r-md)",
            padding: "10px 12px",
            background: "var(--surface)",
          }}
        >
          {feedback}
        </div>
      ) : null}

      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          padding: 16,
          marginBottom: 16,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Créer classes en lot</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
            alignItems: "end",
          }}
        >
          <Input
            label="Niveau"
            type="number"
            value={form.level}
            onChange={(e) =>
              setForm((p) => ({ ...p, level: Number(e.target.value) }))
            }
          />
          <Select
            label="Section"
            value={form.section}
            onChange={(e) =>
              setForm((p) => ({ ...p, section: e.target.value }))
            }
          >
            {sectionOptions.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </Select>
          <Input
            label="Nombre de classes"
            type="number"
            value={form.nb}
            onChange={(e) =>
              setForm((p) => ({ ...p, nb: Number(e.target.value) }))
            }
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <Btn onClick={submit}>Créer</Btn>
        </div>
      </div>

      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          padding: 16,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Liste des classes ({items.length})</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid var(--border2)",
                borderRadius: "var(--r-md)",
                padding: "8px 10px",
              }}
            >
              {item.niveau} - {item.section} - {item.num}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
