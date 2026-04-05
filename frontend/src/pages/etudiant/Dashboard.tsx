import { sujets } from "../../data/mockData";
import { Avatar } from "../../components/UI";
import type { AppUser, PageId } from "../../types/app";

const A = "var(--etu-accent)";

interface EtudiantDashboardProps {
  user: AppUser;
  onNav: (page: PageId) => void;
}

export default function EtudiantDashboard({
  user,
  onNav,
}: EtudiantDashboardProps) {
  const monSujet =
    sujets.find((sujet) => sujet.etudiant.email === user.email) ?? sujets[0];
  const jury = monSujet?.jury ?? [];

  return (
    <div style={{ padding: "36px 40px", maxWidth: 900 }}>
      <div className="fu" style={{ marginBottom: 40 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: A,
            textTransform: "uppercase",
            letterSpacing: "2px",
            marginBottom: 10,
          }}
        >
          ◉ Espace étudiant
        </div>
        <h1
          style={{
            fontSize: "clamp(28px,5vw,52px)",
            fontWeight: 800,
            letterSpacing: "-2px",
            lineHeight: 1.05,
          }}
        >
          Bienvenue,
          <br />
          <span
            style={{
              color: A,
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontWeight: 400,
            }}
          >
            {user.name.split(" ")[0]}
          </span>
        </h1>
      </div>

      {monSujet && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            className="fu1"
            style={{
              background: "var(--surface)",
              border: `1px solid ${A}30`,
              borderRadius: "var(--r-xl)",
              padding: "28px 32px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: `linear-gradient(90deg, ${A}, transparent)`,
              }}
            />
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: A,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                marginBottom: 16,
              }}
            >
              ◉ Mon sujet PFE
            </div>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: "-0.5px",
                lineHeight: 1.3,
                marginBottom: 20,
                color: "var(--text)",
              }}
            >
              {monSujet.titre}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar
                initials={monSujet.encadreur.avatar}
                accent="var(--ens-accent)"
                size={38}
              />
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--text3)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Encadreur
                </div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    color: "var(--text)",
                  }}
                >
                  {monSujet.encadreur.name}
                </div>
              </div>
            </div>
          </div>

          <div
            className="fu2"
            style={{
              display: "grid",
              gridTemplateColumns: monSujet.datePresentation
                ? "1fr 1fr"
                : "1fr",
              gap: 16,
            }}
          >
            {monSujet.datePresentation ? (
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-xl)",
                  padding: "24px 28px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: 3,
                    background: A,
                  }}
                />
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--text3)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: 16,
                  }}
                >
                  Date de soutenance
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      fontSize: 40,
                      fontWeight: 800,
                      color: A,
                      letterSpacing: "-2px",
                      lineHeight: 1,
                    }}
                  >
                    {new Date(monSujet.datePresentation).toLocaleDateString(
                      "fr-FR",
                      { day: "numeric" },
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 16,
                      color: "var(--text)",
                      marginTop: 4,
                    }}
                  >
                    {new Date(monSujet.datePresentation).toLocaleDateString(
                      "fr-FR",
                      { month: "long", year: "numeric" },
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 20 }}>
                  {[
                    ["Heure", monSujet.heure],
                    ["Salle", monSujet.salle],
                  ].map(([key, value]) => (
                    <div key={key}>
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 10,
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
                          fontSize: 16,
                          fontWeight: 700,
                          color: "var(--text)",
                        }}
                      >
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: "rgba(255,181,71,0.04)",
                  border: "1px dashed rgba(255,181,71,0.3)",
                  borderRadius: "var(--r-xl)",
                  padding: "24px 28px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 10 }}>◌</div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    color: "var(--warning)",
                  }}
                >
                  Date de soutenance non encore planifiée
                </div>
              </div>
            )}

            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-xl)",
                padding: "24px 28px",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--text3)",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: 16,
                }}
              >
                Composition du jury
              </div>
              {jury.length === 0 ? (
                <div
                  style={{
                    color: "var(--text3)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                  }}
                >
                  Jury non encore attribué
                </div>
              ) : (
                jury.map((juryMember) => (
                  <div
                    key={juryMember.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 14,
                    }}
                  >
                    <Avatar
                      initials={juryMember.name
                        .split(" ")
                        .map((name) => name[0])
                        .join("")
                        .slice(0, 2)}
                      accent={
                        juryMember.role === "président"
                          ? "var(--warning)"
                          : "var(--etu-accent)"
                      }
                      size={36}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>
                        {juryMember.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 10,
                          color:
                            juryMember.role === "président"
                              ? "var(--warning)"
                              : "var(--etu-accent)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {juryMember.role}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {monSujet.datePresentation &&
            (() => {
              const diff = Math.max(
                0,
                Math.ceil(
                  (new Date(monSujet.datePresentation).getTime() -
                    new Date().getTime()) /
                    (1000 * 60 * 60 * 24),
                ),
              );
              return (
                <div
                  className="fu3"
                  style={{
                    background:
                      diff <= 7 ? "rgba(255,77,109,0.04)" : "var(--etu-dim)",
                    border: `1px solid ${diff <= 7 ? "rgba(255,77,109,0.2)" : `${A}25`}`,
                    borderRadius: "var(--r-xl)",
                    padding: "20px 28px",
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                  }}
                >
                  <div
                    style={{
                      fontSize: 48,
                      fontWeight: 800,
                      color: diff <= 7 ? "var(--danger)" : A,
                      letterSpacing: "-3px",
                      lineHeight: 1,
                    }}
                  >
                    {diff}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>
                      jour{diff !== 1 ? "s" : ""} avant la soutenance
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: "var(--text2)",
                        marginTop: 4,
                      }}
                    >
                      {diff <= 7
                        ? "⚠ Plus que quelques jours — préparez-vous !"
                        : "Bon courage dans vos préparations"}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onNav("forum");
                    }}
                    style={{
                      marginLeft: "auto",
                      padding: "10px 20px",
                      border: `1px solid ${A}40`,
                      borderRadius: "var(--r-md)",
                      background: "transparent",
                      color: A,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: 13,
                    }}
                  >
                    Poser une question →
                  </button>
                </div>
              );
            })()}
        </div>
      )}
    </div>
  );
}
