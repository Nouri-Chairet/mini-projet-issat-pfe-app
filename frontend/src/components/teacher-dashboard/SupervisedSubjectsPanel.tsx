import { Avatar, StatusTag } from "../UI";
import type { Sujet } from "../../types/app";

interface Props {
  accent: string;
  userName: string;
  mesSujets: Sujet[];
  mesJurys: Sujet[];
}

export default function SupervisedSubjectsPanel({
  accent,
  userName,
  mesSujets,
  mesJurys,
}: Props) {
  return (
    <div className="fu2">
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: accent,
          textTransform: "uppercase",
          letterSpacing: "1.5px",
          marginBottom: 14,
        }}
      >
        Sujets encadrés
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {mesSujets.length === 0 && (
          <div
            style={{
              color: "var(--text3)",
              fontFamily: "var(--font-mono)",
              fontSize: 13,
            }}
          >
            Aucun sujet encadré
          </div>
        )}
        {mesSujets.map((sujet) => (
          <div
            key={sujet.id}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-xl)",
              padding: "18px 22px",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `${accent}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <Avatar
                initials={sujet.etudiant.avatar}
                accent={accent}
                size={36}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    lineHeight: 1.4,
                    marginBottom: 4,
                  }}
                >
                  {sujet.titre}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "var(--text2)",
                  }}
                >
                  {sujet.etudiant.name}
                </div>
              </div>
              <StatusTag statut={sujet.statut} />
            </div>
            {sujet.datePresentation && (
              <div
                style={{
                  display: "flex",
                  gap: 20,
                  padding: "10px 0 0",
                  borderTop: "1px solid var(--border)",
                }}
              >
                {[
                  [
                    "DATE",
                    new Date(sujet.datePresentation).toLocaleDateString(
                      "fr-FR",
                      { day: "numeric", month: "short" },
                    ),
                  ],
                  ["HEURE", sujet.heure],
                  ["SALLE", sujet.salle],
                ].map(([key, value]) => (
                  <div key={key}>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 9,
                        color: "var(--text3)",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      {key}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 13,
                        color: accent,
                        fontWeight: 600,
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {mesJurys.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--etu-accent)",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              marginBottom: 14,
            }}
          >
            Participations jury
          </div>
          {mesJurys.map((sujet) => {
            const role = sujet.jury.find(
              (juryMember) => juryMember.name === userName,
            )?.role;
            return (
              <div
                key={sujet.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-lg)",
                  padding: "14px 18px",
                  marginBottom: 10,
                }}
              >
                <Avatar
                  initials={sujet.etudiant.avatar}
                  accent="var(--etu-accent)"
                  size={30}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {sujet.etudiant.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--text3)",
                    }}
                  >
                    {sujet.datePresentation
                      ? new Date(sujet.datePresentation).toLocaleDateString(
                          "fr-FR",
                          { day: "numeric", month: "short" },
                        )
                      : "—"}
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color:
                      role === "président"
                        ? "var(--warning)"
                        : "var(--etu-accent)",
                    border: `1px solid ${role === "président" ? "var(--warning)" : "var(--etu-accent)"}40`,
                    padding: "3px 10px",
                    borderRadius: 40,
                  }}
                >
                  {role}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
