import { useEffect, useMemo, useState } from "react";
import type { AppUser } from "../../types/app";
import {
  exportTimetableIcs,
  getTeacherTimetable,
  logTimetableTelemetry,
  type TeacherScheduleItem,
} from "../../services/timetable";
import { Btn, Select } from "../../components/UI";

interface TeacherEmploiProps {
  user: AppUser;
}

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

export default function EnseignantEmploi({ user }: TeacherEmploiProps) {
  const [items, setItems] = useState<TeacherScheduleItem[]>([]);
  const [feedback, setFeedback] = useState("");
  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [selectedDay, setSelectedDay] = useState("Lundi");

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!user.schemaUserId) {
        setFeedback("Identifiant enseignant introuvable.");
        return;
      }

      try {
        const schedules = await getTeacherTimetable(user.schemaUserId);
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
    logTimetableTelemetry("teacher_timetable_opened", "/teacher/emploi").catch(
      () => undefined,
    );
    return () => {
      mounted = false;
    };
  }, [user.schemaUserId]);

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

  const groupedByDay = useMemo(() => {
    const map = new Map<string, TeacherScheduleItem[]>();
    for (const item of sortedItems) {
      map.set(item.day_of_week, [...(map.get(item.day_of_week) ?? []), item]);
    }
    return map;
  }, [sortedItems]);

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
      anchor.download = "teacher-timetable.ics";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setFeedback("Erreur lors de l'export ICS.");
    }
  };

  return (
    <div style={{ padding: "36px 40px", maxWidth: 1000 }}>
      <h1 style={{ marginTop: 0, marginBottom: 8 }}>Mon emploi du temps</h1>


      <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "end" }}>
        <Select
          label="Vue"
          value={viewMode}
          onChange={(event) => setViewMode(event.target.value as "week" | "day")}
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
            {["Lundi", "Mardi", "Mercredi", "jeudi", "Vendredi", "Samedi"].map((day) => (
              <option key={day} value={day}>
                {DAY_DISPLAY[day] ?? day}
              </option>
            ))}
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
        {(viewMode === "week" ? displayItems : displayItems).map((item) => (
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
              {item.subject} • {item.class}
            </div>
            <div style={{ color: "var(--text3)", fontSize: 13 }}>
              {item.room}
            </div>
          </div>
        ))}
      </div>

      {viewMode === "week" ? (
        <div style={{ marginTop: 16 }}>
          {Array.from(groupedByDay.entries()).map(([day, dayItems]) => (
            <div key={day} style={{ marginBottom: 10, color: "var(--text2)", fontSize: 13 }}>
              {DAY_DISPLAY[day] ?? day}: {dayItems.length} séance(s)
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
