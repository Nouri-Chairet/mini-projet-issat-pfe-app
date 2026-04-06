import { sujets } from "../../data/mockData";
import { StatusTag, Avatar } from "../../components/UI";
import type { AppUser, Sujet } from "../../types/app";

const A = "var(--ens-accent)";

interface EnseignantPlanningProps {
  user: AppUser;
}

export default function EnseignantPlanning({ user }: EnseignantPlanningProps) {
  const mesSujets = sujets.filter(
    (sujet) => sujet.encadreur.name === user.name && sujet.datePresentation,
  );
  const mesJurys = sujets.filter(
    (sujet) =>
      sujet.jury.some((juryMember) => juryMember.name === user.name) &&
      sujet.datePresentation,
  );
  const tous = [
    ...new Map(
      [...mesSujets, ...mesJurys].map((sujet) => [sujet.id, sujet]),
    ).values(),
  ].sort(
    (a: Sujet, b: Sujet) =>
      new Date(a.datePresentation as string).getTime() -
      new Date(b.datePresentation as string).getTime(),
  );

  return (
    <div style={{ padding: "36px 40px", maxWidth: 900 }}>
      <div className="fu" style={{ marginBottom: 36 }}>
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
          ▤ Planning
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-1.5px" }}>
          Mon{" "}
          <span
            style={{
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              color: A,
              fontWeight: 400,
            }}
          >
            calendrier
          </span>
        </h1>
        <p
          style={{
            color: "var(--text2)",
            marginTop: 8,
            fontFamily: "var(--font-mono)",
            fontSize: 12,
          }}
        >
          {tous.length} soutenances à venir
        </p>
      </div>

      {tous.length === 0 ? (
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-xl)",
            padding: "48px",
            textAlign: "center",
            color: "var(--text3)",
            fontFamily: "var(--font-mono)",
          }}
        >
          Aucune soutenance planifiée pour le moment
        </div>
      ) : (
        <div
          className="fu1"
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          {tous.map((sujet) => {
            const isEncadreur = sujet.encadreur.name === user.name;
            const juryRole = sujet.jury.find(
              (juryMember) => juryMember.name === user.name,
            )?.role;
            return (
              <div
                key={sujet.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "120px 1fr auto",
                  gap: 20,
                  background: "var(--surface)",
                  border: `1px solid ${isEncadreur ? `${A}30` : "var(--border)"}`,
                  borderRadius: "var(--r-xl)",
                  padding: "22px 24px",
                  alignItems: "center",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${A}50`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isEncadreur
                    ? `${A}30`
                    : "var(--border)";
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    background: isEncadreur ? "var(--ens-dim)" : "var(--bg3)",
                    borderRadius: "var(--r-md)",
                    padding: "14px 10px",
                    border: `1px solid ${isEncadreur ? `${A}30` : "var(--border)"}`,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 28,
                      fontWeight: 700,
                      color: isEncadreur ? A : "var(--text)",
                      lineHeight: 1,
                    }}
                  >
                    {new Date(sujet.datePresentation as string).getDate()}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 11,
                      color: "var(--text3)",
                      marginTop: 4,
                    }}
                  >
                    {new Date(
                      sujet.datePresentation as string,
                    ).toLocaleDateString("fr-FR", { month: "short" })}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        padding: "3px 10px",
                        borderRadius: 40,
                        background: isEncadreur
                          ? "var(--ens-dim)"
                          : "var(--etu-dim)",
                        color: isEncadreur ? A : "var(--etu-accent)",
                        border: `1px solid ${isEncadreur ? A : "var(--etu-accent)"}30`,
                      }}
                    >
                      {isEncadreur ? "◆ Encadreur" : `◉ ${juryRole}`}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        color: "var(--text3)",
                      }}
                    >
                      {sujet.heure} · {sujet.salle}
                    </span>
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 15,
                      marginBottom: 6,
                      lineHeight: 1.4,
                    }}
                  >
                    {sujet.titre}
                  </div>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <Avatar
                      initials={sujet.etudiant.avatar}
                      accent="var(--etu-accent)"
                      size={22}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: "var(--text2)",
                      }}
                    >
                      {sujet.etudiant.name}
                    </span>
                  </div>
                </div>
                <StatusTag statut={sujet.statut} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
