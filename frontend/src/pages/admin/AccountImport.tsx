import { useRef, useState } from "react";
import axios from "axios";
import { getStoredSession } from "../../services/auth";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000";

function authHeaders() {
  const token = getStoredSession()?.tokens.access;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface ImportResult {
  message: string;
  created: number;
  updated: number;
  skipped: number;
  total_rows: number;
  errors: string[];
}

type Tab = "students" | "teachers";

const TAB_CONFIG: Record<Tab, { label: string; endpoint: string; columns: string[] }> = {
  students: {
    label: "Étudiants",
    endpoint: `${API_BASE_URL}/api/admin/import/students/`,
    columns: ["cin", "first_name", "last_name", "email", "class (opt.)", "phone (opt.)"],
  },
  teachers: {
    label: "Enseignants",
    endpoint: `${API_BASE_URL}/api/admin/import/teachers/`,
    columns: ["cin", "first_name", "last_name", "email", "department", "age"],
  },
};

const A = "var(--chef-accent)";

export default function AccountImport() {
  const [tab, setTab] = useState<Tab>("students");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const cfg = TAB_CONFIG[tab];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    setResult(null);
    setError("");
  };

  const handleTabChange = (next: Tab) => {
    setTab(next);
    setFile(null);
    setResult(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!file) return;
    setBusy(true);
    setResult(null);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post<ImportResult>(cfg.endpoint, formData, {
        headers: { ...authHeaders() },
      });
      setResult(response.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } }; message?: string };
      setError(e?.response?.data?.error ?? e?.message ?? "Import failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: "36px 40px", maxWidth: 860 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
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
          ◎ Import comptes
        </div>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800 }}>
          Import{" "}
          <span style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", color: A, fontWeight: 400 }}>
            Excel
          </span>
        </h1>
        <p style={{ color: "var(--text2)", marginTop: 8, marginBottom: 0 }}>
          Importer des comptes depuis un fichier .xlsx. Les utilisateurs existants (même CIN ou email) seront mis à jour.
          Le mot de passe initial est le numéro CIN.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: "1px solid var(--border)" }}>
        {(["students", "teachers"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            style={{
              padding: "10px 22px",
              border: "none",
              borderBottom: tab === t ? `2px solid ${A}` : "2px solid transparent",
              background: "none",
              color: tab === t ? A : "var(--text2)",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "1px",
              cursor: "pointer",
              fontWeight: tab === t ? 700 : 400,
              transition: "color 0.15s",
            }}
          >
            {TAB_CONFIG[t].label}
          </button>
        ))}
      </div>

      {/* Column reference */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          padding: "14px 18px",
          marginBottom: 20,
        }}
      >
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text2)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px" }}>
          Colonnes attendues
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {cfg.columns.map((col) => (
            <span
              key={col}
              style={{
                background: "var(--bg2)",
                border: "1px solid var(--border2)",
                borderRadius: 6,
                padding: "3px 10px",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: col.includes("opt") ? "var(--text3)" : "var(--text)",
              }}
            >
              {col}
            </span>
          ))}
        </div>
        {tab === "students" && (
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--text3)" }}>
            Format colonne <code>class</code>: <code>niveau-section-num</code> ex.{" "}
            <code>1-Prépa-1</code> ou <code>2-L-LSI-3</code>
          </div>
        )}
      </div>

      {/* Upload zone */}
      <div
        style={{
          border: `2px dashed ${file ? A : "var(--border2)"}`,
          borderRadius: "var(--r-xl)",
          padding: "28px 24px",
          textAlign: "center",
          marginBottom: 18,
          background: file ? `${A}08` : "var(--surface)",
          transition: "all 0.2s",
        }}
      >
        {file ? (
          <div>
            <div style={{ fontSize: 28, marginBottom: 6 }}>📄</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>{file.name}</div>
            <div style={{ color: "var(--text2)", fontSize: 13 }}>
              {(file.size / 1024).toFixed(1)} KB
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 32, marginBottom: 8, color: "var(--text3)" }}>⬆</div>
            <div style={{ color: "var(--text2)" }}>Sélectionnez un fichier .xlsx</div>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          onChange={handleFileChange}
          style={{
            display: "block",
            margin: "14px auto 0",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 13,
          }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        <button
          onClick={handleUpload}
          disabled={!file || busy}
          style={{
            padding: "10px 22px",
            background: !file || busy ? "var(--border)" : A,
            color: !file || busy ? "var(--text3)" : "#000",
            border: "none",
            borderRadius: "var(--r-md)",
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "1px",
            cursor: !file || busy ? "not-allowed" : "pointer",
            transition: "opacity 0.15s",
          }}
        >
          {busy ? "Importation…" : "Importer"}
        </button>
        {file && (
          <button
            onClick={() => {
              setFile(null);
              setResult(null);
              setError("");
              if (inputRef.current) inputRef.current.value = "";
            }}
            style={{
              padding: "10px 18px",
              background: "none",
              border: "1px solid var(--border2)",
              borderRadius: "var(--r-md)",
              color: "var(--text2)",
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
            }}
          >
            Effacer
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "var(--r-md)",
            padding: "12px 16px",
            color: "#ef4444",
            marginBottom: 18,
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: "var(--r-xl)",
            overflow: "hidden",
          }}
        >
          {/* Summary */}
          <div
            style={{
              padding: "16px 20px",
              background: "var(--surface)",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <Stat label="Créés" value={result.created} color="var(--chef-accent)" />
            <Stat label="Mis à jour" value={result.updated} color="var(--ens-accent)" />
            <Stat label="Ignorés" value={result.skipped} color="var(--warning)" />
            <Stat label="Total lignes" value={result.total_rows} color="var(--text2)" />
          </div>

          {/* Success banner */}
          {result.errors.length === 0 && (
            <div
              style={{
                padding: "10px 20px",
                background: "rgba(34,197,94,0.08)",
                color: "#22c55e",
                fontSize: 13,
                fontFamily: "var(--font-mono)",
              }}
            >
              ✓ Import terminé sans erreurs
            </div>
          )}

          {/* Errors */}
          {result.errors.length > 0 && (
            <div style={{ padding: 16 }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "#ef4444",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: 10,
                }}
              >
                {result.errors.length} erreur{result.errors.length !== 1 ? "s" : ""}
              </div>
              <div
                style={{
                  display: "grid",
                  gap: 6,
                  maxHeight: 300,
                  overflowY: "auto",
                }}
              >
                {result.errors.map((err, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "8px 12px",
                      background: "rgba(239,68,68,0.05)",
                      border: "1px solid rgba(239,68,68,0.15)",
                      borderRadius: "var(--r-md)",
                      fontSize: 13,
                      color: "var(--text)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {err}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text2)", textTransform: "uppercase", letterSpacing: "1px" }}>
        {label}
      </div>
    </div>
  );
}
