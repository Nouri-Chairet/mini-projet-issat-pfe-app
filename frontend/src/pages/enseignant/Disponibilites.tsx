import { useState } from "react";
import { enseignants } from "../../data/mockData";
import { Btn } from "../../components/UI";
import type { AppUser } from "../../types/app";

const A = "var(--ens-accent)";
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

interface EnseignantDisponibilitesProps {
  user: AppUser;
}

export default function EnseignantDisponibilites({
  user,
}: EnseignantDisponibilitesProps) {
  const prof =
    enseignants.find((enseignant) => enseignant.name === user.name) ??
    enseignants[0];
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState(5);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(prof.disponibilites),
  );
  const [saved, setSaved] = useState(false);

  const first = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array(first).fill(null),
    ...Array.from({ length: lastDay }, (_, index) => index + 1),
  ];

  const dateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const toggleDay = (day: number) => {
    const currentDate = dateStr(day);
    const next = new Set(selected);
    if (next.has(currentDate)) {
      next.delete(currentDate);
    } else {
      next.add(currentDate);
    }
    setSelected(next);
    setSaved(false);
  };

  const allDates = Array.from(selected).sort();

  return (
    <div style={{ padding: "36px 40px", maxWidth: 900 }}>
      <div
        className="fu"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 36,
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
            ◌ Calendrier
          </div>
          <h1
            style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-1.5px" }}
          >
            Mes{" "}
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                color: A,
                fontWeight: 400,
              }}
            >
              disponibilités
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
            {selected.size} jour(s) sélectionné(s)
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn
            accent={A}
            variant="ghost"
            onClick={() => {
              setSelected(new Set());
            }}
          >
            Réinitialiser
          </Btn>
          <Btn
            accent={A}
            onClick={() => {
              setSaved(true);
            }}
          >
            {saved ? "✓ Sauvegardé" : "Sauvegarder"}
          </Btn>
        </div>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 24 }}
      >
        <div
          className="fu1"
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
                fontSize: 18,
              }}
            >
              ‹
            </button>
            <span style={{ fontWeight: 700, fontSize: 17 }}>
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
                fontSize: 18,
              }}
            >
              ›
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7,1fr)",
              gap: 4,
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
              gap: 4,
            }}
          >
            {cells.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} />;
              }
              const dayNum = day as number;
              const dayStr = dateStr(dayNum);
              const isSelected = selected.has(dayStr);
              const currentDay = new Date(year, month, dayNum).getDay();
              const isWeekend = currentDay === 0 || currentDay === 6;

              return (
                <button
                  key={`day-${index}`}
                  onClick={() => {
                    if (!isWeekend) {
                      toggleDay(dayNum);
                    }
                  }}
                  style={{
                    aspectRatio: "1",
                    minHeight: 42,
                    borderRadius: 10,
                    border: isSelected
                      ? `1px solid ${A}`
                      : "1px solid transparent",
                    background: isSelected ? "var(--ens-dim)" : "transparent",
                    color: isWeekend
                      ? "var(--text3)"
                      : isSelected
                        ? A
                        : "var(--text)",
                    cursor: isWeekend ? "not-allowed" : "pointer",
                    fontSize: 13,
                    fontWeight: isSelected ? 700 : 400,
                    transition: "all 0.12s",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !isWeekend) {
                      e.currentTarget.style.background =
                        "rgba(255,107,53,0.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {dayNum}
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 5,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: 4,
                        height: 4,
                        borderRadius: "50%",
                        background: A,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <div
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTop: "1px solid var(--border)",
              display: "flex",
              gap: 16,
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--text3)",
            }}
          >
            <span>● Sélectionné</span>
            <span style={{ opacity: 0.4 }}>Cliquer pour (dé)sélectionner</span>
          </div>
        </div>

        <div className="fu2">
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--text3)",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: 14,
            }}
          >
            Dates sélectionnées
          </div>
          {allDates.length === 0 ? (
            <div
              style={{
                color: "var(--text3)",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
              }}
            >
              Aucune date sélectionnée
            </div>
          ) : (
            allDates.map((date) => (
              <div
                key={date}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "var(--surface)",
                  border: `1px solid ${A}25`,
                  borderRadius: "var(--r-md)",
                  marginBottom: 8,
                }}
              >
                <div>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 13,
                      color: A,
                      fontWeight: 600,
                    }}
                  >
                    {new Date(date).toLocaleDateString("fr-FR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                </div>
                <button
                  onClick={() => {
                    const next = new Set(selected);
                    next.delete(date);
                    setSelected(next);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text3)",
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  ×
                </button>
              </div>
            ))
          )}

          {saved && (
            <div
              style={{
                marginTop: 16,
                padding: "12px 14px",
                background: "rgba(0,229,160,0.06)",
                border: "1px solid var(--chef-accent)30",
                borderRadius: "var(--r-md)",
                fontFamily: "var(--font-mono)",
                fontSize: 12,
                color: "var(--chef-accent)",
              }}
            >
              ✓ Disponibilités sauvegardées
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
