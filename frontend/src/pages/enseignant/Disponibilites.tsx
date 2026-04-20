import { useEffect, useMemo, useState } from "react";
import { Btn, Input } from "../../components/UI";
import {
  getPfeCampaign,
  getTeacherAvailability,
  setTeacherAvailabilityDateException,
  type PfeCampaign,
} from "../../services/admin";

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

export default function EnseignantDisponibilites() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [campaign, setCampaign] = useState<PfeCampaign | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [initialSelection, setInitialSelection] = useState<Set<string>>(
    new Set(),
  );
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const dayStartTime = campaign?.day_start_time.slice(0, 5) || "08:00";
  const dayEndTime = campaign?.day_end_time.slice(0, 5) || "16:00";

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        setLoading(true);
        const currentCampaign = await getPfeCampaign();
        if (!mounted) {
          return;
        }
        setCampaign(currentCampaign);

        const availability = await getTeacherAvailability({
          context: "pfe",
          campaign_id: currentCampaign.id,
        });

        if (!mounted) {
          return;
        }

        const selectedDates = new Set(
          availability.date_exceptions
            .filter((item) => item.level !== "unavailable")
            .map((item) => item.availability_date),
        );
        setSelected(selectedDates);
        setInitialSelection(new Set(selectedDates));
      } catch {
        if (mounted) {
          setFeedback("Aucune période PFE active pour le moment.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const first = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const cells = [
    ...Array(first).fill(null),
    ...Array.from({ length: lastDay }, (_, index) => index + 1),
  ];

  const dateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const withinCampaignRange = (day: number) => {
    if (!campaign) {
      return false;
    }
    const d = dateStr(day);
    return d >= campaign.start_date && d <= campaign.end_date;
  };

  const toggleDay = (day: number) => {
    const d = dateStr(day);
    const next = new Set(selected);
    if (next.has(d)) {
      next.delete(d);
    } else {
      next.add(d);
    }
    setSelected(next);
  };

  const allDates = useMemo(() => [...selected].sort(), [selected]);

  const saveSelection = async () => {
    if (!campaign) {
      setFeedback("Aucune campagne active.");
      return;
    }

    try {
      setLoading(true);

      const adds = [...selected].filter((d) => !initialSelection.has(d));
      const removals = [...initialSelection].filter((d) => !selected.has(d));

      for (const d of adds) {
        await setTeacherAvailabilityDateException({
          context: "pfe",
          campaign_id: campaign.id,
          availability_date: d,
          start_time: dayStartTime,
          end_time: dayEndTime,
          level: "preferred",
        });
      }

      for (const d of removals) {
        await setTeacherAvailabilityDateException({
          context: "pfe",
          campaign_id: campaign.id,
          availability_date: d,
          start_time: dayStartTime,
          end_time: dayEndTime,
          level: "unavailable",
        });
      }

      setInitialSelection(new Set(selected));
      setFeedback("Disponibilités envoyées pour la période PFE.");
    } catch {
      setFeedback("Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "36px 40px", maxWidth: 960 }}>
      <div style={{ marginBottom: 22 }}>
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
          Disponibilites PFE
        </div>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            letterSpacing: "-1.5px",
            margin: 0,
          }}
        >
          Soumettre mes créneaux
        </h1>
        <p style={{ color: "var(--text2)", marginTop: 8 }}>
          Sélectionnez vos dates disponibles pendant la période active puis
          sauvegardez.
        </p>
      </div>

      {campaign ? (
        <div
          style={{
            border: "1px solid var(--border)",
            background: "var(--surface)",
            borderRadius: "var(--r-md)",
            padding: "10px 12px",
            marginBottom: 14,
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--text2)",
          }}
        >
          Campagne: {campaign.name} | {campaign.start_date} →{" "}
          {campaign.end_date} | {dayStartTime}-{dayEndTime}
        </div>
      ) : null}

      {feedback ? (
        <div
          style={{
            border: "1px solid var(--border)",
            background: "var(--surface)",
            borderRadius: "var(--r-md)",
            padding: "10px 12px",
            marginBottom: 14,
            color: "var(--text2)",
          }}
        >
          {feedback}
        </div>
      ) : null}

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 18 }}
      >
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--r-xl)",
            padding: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 22,
            }}
          >
            <button
              onClick={() => {
                if (month === 0) {
                  setMonth(11);
                  setYear((value) => value - 1);
                } else {
                  setMonth((value) => value - 1);
                }
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                border: "1px solid var(--border2)",
                background: "none",
                cursor: "pointer",
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
                  setYear((value) => value + 1);
                } else {
                  setMonth((value) => value + 1);
                }
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                border: "1px solid var(--border2)",
                background: "none",
                cursor: "pointer",
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
              const dayISO = dateStr(dayNum);
              const isSelected = selected.has(dayISO);
              const jsDay = new Date(year, month, dayNum).getDay();
              const isWeekend = jsDay === 0 || jsDay === 6;
              const inRange = withinCampaignRange(dayNum);
              const disabled = !campaign || !inRange || isWeekend;

              return (
                <button
                  key={`day-${index}`}
                  onClick={() => {
                    if (!disabled) {
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
                    color: disabled
                      ? "var(--text3)"
                      : isSelected
                        ? A
                        : "var(--text)",
                    cursor: disabled ? "not-allowed" : "pointer",
                    fontSize: 13,
                    fontWeight: isSelected ? 700 : 400,
                  }}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 16 }}>
            <Btn accent={A} onClick={saveSelection}>
              Envoyer mes disponibilités
            </Btn>
          </div>
        </div>

        <div>
          <Input
            label="Dates sélectionnées"
            value={`${allDates.length}`}
            readOnly
          />
          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            {allDates.map((d) => (
              <div
                key={d}
                style={{
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  borderRadius: "var(--r-md)",
                  padding: "8px 10px",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                }}
              >
                {d}
              </div>
            ))}
            {!allDates.length ? (
              <div
                style={{
                  color: "var(--text3)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                }}
              >
                Aucune date sélectionnée.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {loading ? (
        <p style={{ color: "var(--text3)", marginTop: 12 }}>Chargement...</p>
      ) : null}
    </div>
  );
}
