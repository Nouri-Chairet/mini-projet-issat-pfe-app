import { useEffect, useMemo, useState } from "react";
import {
  exportTimetableIcs,
  getStudentTimetable,
  logTimetableTelemetry,
  type TeacherScheduleItem,
} from "../../services/timetable";
import { Btn, Select } from "../../components/UI";

const weekOrder: Record<string, number> = {
  Lundi: 1,
  Mardi: 2,
  Mercredi: 3,
  jeudi: 4,
  Vendredi: 5,
  Samedi: 6,
};

const DAY_DISPLAY: Record<string, string> = {
  Lundi: "Lundi",
  Mardi: "Mardi",
  Mercredi: "Mercredi",
  jeudi: "Jeudi",
  Vendredi: "Vendredi",
  Samedi: "Samedi",
};

export default function EtudiantEmploi() {
  const [items, setItems] = useState<TeacherScheduleItem[]>([]);
  const [feedback, setFeedback] = useState("");
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [selectedDay, setSelectedDay] = useState("Lundi");

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const schedules = await getStudentTimetable();
        if (mounted) {
          setItems(schedules);
        }
      } catch {
        if (mounted) {
          setFeedback("Erreur de chargement de l'emploi du temps.");
        }
      }
    }

    load();
    logTimetableTelemetry("student_timetable_opened", "/student/emploi").catch(
      () => undefined,
    );
    return () => {
      mounted = false;
    };
  }, []);

  const sortedItems = useMemo(
    () =>
      [...items].sort((left, right) => {
        const dayDiff =
          (weekOrder[left.day_of_week] ?? 99) -
          (weekOrder[right.day_of_week] ?? 99);
        if (dayDiff !== 0) {
          return dayDiff;
        }
        return left.start_time.localeCompare(right.start_time);
      }),
    [items],
  );

  const displayItems =
    viewMode === "day"
      ? sortedItems.filter((item) => item.day_of_week === selectedDay)
      : sortedItems;

  const downloadIcs = async () => {
    try {
      const blob = await exportTimetableIcs();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "student-timetable.ics";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setFeedback("Erreur lors de l'export ICS.");
    }
  };

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1000 }}>
      <h1 style={{ marginTop: 0, marginBottom: 8 }}>Emploi du temps</h1>
      <p style={{ color: "var(--text2)", marginTop: 0, marginBottom: 18 }}>
        Milestone 4 — consommation étudiant.
      </p>

      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 14,
          alignItems: "end",
        }}
      >
        <Select
          label="Vue"
          value={viewMode}
          onChange={(event) =>
            setViewMode(event.target.value as "week" | "day")
          }
        >
          <option value="week">Semaine</option>
          <option value="day">Jour</option>
        </Select>
        {viewMode === "day" ? (
          <Select
            label="Jour"
            value={selectedDay}
            onChange={(event) => setSelectedDay(event.target.value)}
          >
            {["Lundi", "Mardi", "Mercredi", "jeudi", "Vendredi", "Samedi"].map(
              (day) => (
                <option key={day} value={day}>
                  {DAY_DISPLAY[day] ?? day}
                </option>
              ),
            )}
          </Select>
        ) : null}
        <Btn onClick={downloadIcs} variant="ghost">
          Export ICS
        </Btn>
        <Btn onClick={() => window.print()} variant="ghost">
          Imprimer
        </Btn>
      </div>

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

      <div style={{ display: "grid", gap: 10 }}>
        {displayItems.map((item) => (
          <div
            key={item.id}
            style={{
              border: "1px solid var(--border)",
              borderRadius: "var(--r-lg)",
              padding: "12px 14px",
              background: "var(--surface)",
            }}
          >
            <strong>
              {DAY_DISPLAY[item.day_of_week] ?? item.day_of_week} • {item.start_time} - {item.end_time}
            </strong>
            <div style={{ color: "var(--text2)", marginTop: 4 }}>
              {item.subject} • {item.room}
            </div>
            <div style={{ color: "var(--text3)", fontSize: 13 }}>
              Enseignant: {item.teacher}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
