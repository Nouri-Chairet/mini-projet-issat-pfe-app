import { Stat } from "../UI";

interface Props {
  accent: string;
  userName: string;
  supervisedCount: number;
  juryCount: number;
  availabilityCount: number;
  total: number;
}

export default function TeacherDashboardHero({
  accent,
  userName,
  supervisedCount,
  juryCount,
  availabilityCount,
  total,
}: Props) {
  return (
    <>
      <div className="fu" style={{ marginBottom: 44 }}>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: accent,
            textTransform: "uppercase",
            letterSpacing: "2px",
            marginBottom: 10,
          }}
        >
          Espace enseignant
        </div>
        <h1
          style={{
            fontSize: "clamp(28px,4vw,48px)",
            fontWeight: 800,
            letterSpacing: "-2px",
            lineHeight: 1.05,
          }}
        >
          Bonjour,
          <br />
          <span
            style={{
              color: accent,
              fontFamily: "var(--font-serif)",
              fontStyle: "italic",
              fontWeight: 400,
            }}
          >
            {userName.split(" ").slice(-1)[0]}
          </span>
        </h1>
        <p
          style={{
            color: "var(--text2)",
            marginTop: 10,
            fontFamily: "var(--font-mono)",
            fontSize: 12,
          }}
        >
          {supervisedCount} sujet(s) encadré(s) · {total} participations totales
        </p>
      </div>

      <div
        className="fu1"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 14,
          marginBottom: 36,
        }}
      >
        <Stat
          label="Sujets encadrés"
          value={supervisedCount}
          accent={accent}
          sub={`${supervisedCount * 3} participations requises`}
        />
        <Stat
          label="Jurys assignés"
          value={juryCount}
          accent="var(--etu-accent)"
          sub="Comme président ou rapporteur"
        />
        <Stat
          label="Disponibilités"
          value={availabilityCount}
          accent="var(--chef-accent)"
          sub="Dates déclarées"
        />
      </div>
    </>
  );
}
