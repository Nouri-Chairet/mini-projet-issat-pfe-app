import { Btn } from "../UI";
import type { TeacherCurrentSession } from "../../services/timetable";

interface Props {
  currentSession: TeacherCurrentSession | null;
  onViewTimetable: () => void;
}

export default function CurrentSessionBanner({
  currentSession,
  onViewTimetable,
}: Props) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: "var(--r-lg)",
        padding: 16,
        marginBottom: 20,
        background: "var(--surface)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>Séance en cours</div>
        {currentSession ? (
          <div style={{ color: "var(--text2)", fontSize: 13 }}>
            {currentSession.day_of_week} {currentSession.start_time} -{" "}
            {currentSession.end_time} · {currentSession.subject} · Salle{" "}
            {currentSession.room}
          </div>
        ) : (
          <div style={{ color: "var(--text3)", fontSize: 13 }}>
            Aucune séance active actuellement.
          </div>
        )}
      </div>
      <Btn onClick={onViewTimetable} variant="ghost">
        Voir emploi du temps
      </Btn>
    </div>
  );
}
