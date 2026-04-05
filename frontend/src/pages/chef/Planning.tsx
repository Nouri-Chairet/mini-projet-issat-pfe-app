import { useState } from "react";
import { sujets, enseignants } from "../../data/mockData";
import { Avatar, Btn } from "../../components/UI";
import type { Sujet } from "../../types/app";

const A = "var(--chef-accent)";
const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];
const DAYS = ["D", "L", "M", "M", "J", "V", "S"];
const planifies = sujets.filter((sujet) => sujet.datePresentation);

function getPres(year: number, month: number, day: number): Sujet[] {
  const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return planifies.filter((sujet) => sujet.datePresentation === date);
}

export default function ChefPlanning() {
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5);
  const [selected, setSelected] = useState<number | null>(null);
  const [tab, setTab] = useState<"cal" | "list" | "dispo">("cal");

  const first = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array(first).fill(null),
    ...Array.from({ length: lastDay }, (_, index) => index + 1),
  ];

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
            ▤ Planning
          </div>
          <h1
            style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-1.5px" }}
          >
            Soutenances{" "}
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                color: A,
                fontWeight: 400,
              }}
            >
              2025
            </span>
          </h1>
        </div>
        <Btn accent={A}>⚡ Générer automatiquement</Btn>
      </div>

      <div
        className="fu1"
        style={{
          display: "inline-flex",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 40,
          padding: 4,
          marginBottom: 24,
          gap: 4,
        }}
      >
        {[
          ["cal", "Calendrier"],
          ["list", "Liste"],
          ["dispo", "Disponibilités"],
        ].map(([tabId, label]) => (
          <button
            key={tabId}
            onClick={() => {
              setTab(tabId as "cal" | "list" | "dispo");
            }}
            style={{
              padding: "7px 20px",
              borderRadius: 40,
              border: "none",
              background: tab === tabId ? A : "transparent",
              color: tab === tabId ? "#000" : "var(--text2)",
              fontWeight: tab === tabId ? 700 : 400,
              cursor: "pointer",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.8px",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "cal" && (
        <div
          className="fu2"
          style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20 }}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-xl)",
              padding: 28,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 28,
              }}
            >
              <button
                onClick={() => {
                  if (month === 0) {
                    setMonth(11);
                    setYear((currentYear) => currentYear - 1);
                  } else {
                    setMonth((currentMonth) => currentMonth - 1);
                  }
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  border: "1px solid var(--border2)",
                  background: "none",
                  color: "var(--text)",
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                ‹
              </button>
              <span style={{ fontWeight: 700, fontSize: 16 }}>
                {MONTHS[month]} {year}
              </span>
              <button
                onClick={() => {
                  if (month === 11) {
                    setMonth(0);
                    setYear((currentYear) => currentYear + 1);
                  } else {
                    setMonth((currentMonth) => currentMonth + 1);
                  }
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  border: "1px solid var(--border2)",
                  background: "none",
                  color: "var(--text)",
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                ›
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7,1fr)",
                gap: 3,
                marginBottom: 6,
              }}
            >
              {DAYS.map((day, index) => (
                <div
                  key={`${day}-${index}`}
                  style={{
                    textAlign: "center",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    color: "var(--text3)",
                    padding: "4px 0",
                  }}
                >
                  {day}
                </div>
              ))}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7,1fr)",
                gap: 3,
              }}
            >
              {cells.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} />;
                }
                const presentations = getPres(year, month, day as number);
                const isSelected = selected === day;
                return (
                  <button
                    key={`day-${index}`}
                    onClick={() => {
                      setSelected(day === selected ? null : (day as number));
                    }}
                    style={{
                      aspectRatio: "1",
                      borderRadius: 10,
                      border: isSelected
                        ? `1px solid ${A}`
                        : "1px solid transparent",
                      background: isSelected
                        ? "var(--chef-dim)"
                        : presentations.length
                          ? "rgba(0,229,160,0.04)"
                          : "transparent",
                      color: isSelected ? A : "var(--text)",
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: isSelected ? 700 : 400,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 3,
                      transition: "all 0.12s",
                      minHeight: 46,
                    }}
                  >
                    {day}
                    {presentations.length > 0 && (
                      <div style={{ display: "flex", gap: 2 }}>
                        {presentations.map((presentation, dotIndex) => (
                          <div
                            key={`${presentation.id}-${dotIndex}`}
                            style={{
                              width: 4,
                              height: 4,
                              borderRadius: "50%",
                              background: isSelected ? A : `${A}80`,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            {selected && getPres(year, month, selected).length > 0 ? (
              getPres(year, month, selected).map((sujet) => (
                <div
                  key={sujet.id}
                  style={{
                    background: "var(--surface)",
                    border: `1px solid ${A}25`,
                    borderRadius: "var(--r-xl)",
                    padding: "20px 22px",
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: A,
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                      marginBottom: 10,
                    }}
                  >
                    {sujet.heure} · {sujet.salle}
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 14,
                      lineHeight: 1.4,
                      marginBottom: 12,
                    }}
                  >
                    {sujet.titre}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <Avatar
                      initials={sujet.etudiant.avatar}
                      accent={A}
                      size={26}
                    />
                    <span style={{ fontSize: 12, color: "var(--text2)" }}>
                      {sujet.etudiant.name}
                    </span>
                  </div>
                  {sujet.jury.length > 0 && (
                    <div
                      style={{
                        borderTop: "1px solid var(--border)",
                        paddingTop: 10,
                        marginTop: 10,
                      }}
                    >
                      {sujet.jury.map((juryMember) => (
                        <div
                          key={juryMember.id}
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                            color: "var(--text2)",
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              color:
                                juryMember.role === "président"
                                  ? "var(--warning)"
                                  : "var(--etu-accent)",
                              marginRight: 6,
                            }}
                          >
                            {juryMember.role === "président" ? "▲" : "◆"}
                          </span>
                          {juryMember.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--r-xl)",
                  padding: 28,
                  textAlign: "center",
                  color: "var(--text3)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 13,
                }}
              >
                {selected
                  ? "Aucune soutenance ce jour"
                  : "Sélectionner une date"}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "list" && (
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
              gridTemplateColumns: "160px 1fr 1fr 1fr",
              padding: "10px 22px",
              borderBottom: "1px solid var(--border)",
              gap: 16,
            }}
          >
            {["Date / Heure", "Étudiant", "Sujet", "Jury"].map((header) => (
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
            ))}
          </div>
          {planifies.map((sujet, index) => (
            <div
              key={sujet.id}
              style={{
                display: "grid",
                gridTemplateColumns: "160px 1fr 1fr 1fr",
                padding: "16px 22px",
                gap: 16,
                alignItems: "center",
                borderBottom:
                  index < planifies.length - 1
                    ? "1px solid var(--border)"
                    : "none",
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  {new Date(
                    sujet.datePresentation as string,
                  ).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                  })}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: A,
                  }}
                >
                  {sujet.heure} · {sujet.salle}
                </div>
              </div>
              <span style={{ fontSize: 13 }}>{sujet.etudiant.name}</span>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text2)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {sujet.titre}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {sujet.jury.map((juryMember) => (
                  <Avatar
                    key={juryMember.id}
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
                    size={26}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "dispo" && (
        <div
          className="fu2"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
            gap: 14,
          }}
        >
          {enseignants.map((enseignant) => (
            <div
              key={enseignant.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: "var(--r-xl)",
                padding: "20px 22px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <Avatar
                  initials={enseignant.avatar}
                  accent="var(--ens-accent)"
                  size={36}
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>
                    {enseignant.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: "var(--text3)",
                    }}
                  >
                    {enseignant.specialite}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                  marginBottom: 12,
                }}
              >
                {enseignant.disponibilites.map((date) => (
                  <span
                    key={date}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      padding: "4px 10px",
                      borderRadius: 40,
                      background: "var(--chef-dim)",
                      color: A,
                      border: `1px solid ${A}30`,
                    }}
                  >
                    {new Date(date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                ))}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--text3)",
                }}
              >
                {enseignant.nbSujets} sujet(s) ·{" "}
                <span style={{ color: A }}>
                  {enseignant.nbSujets * 3} participations requises
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
