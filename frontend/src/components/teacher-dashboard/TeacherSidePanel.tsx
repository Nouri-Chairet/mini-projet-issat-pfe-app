import type { PageId } from "../../types/app";
import Icon from "../Icon";

interface Props {
  accent: string;
  availabilities: string[];
  supervisedCount: number;
  total: number;
  onNav: (page: PageId) => void;
}

export default function TeacherSidePanel({
  accent,
  availabilities,
  supervisedCount,
  total,
  onNav,
}: Props) {
  const required = supervisedCount * 3;
  const progressPct = Math.min(100, (total / Math.max(1, required)) * 100);

  const quickActions: Array<{
    label: string;
    icon: "calendar-check" | "messages" | "calendar-plus" | "clipboard-check";
    page: PageId;
    span?: boolean;
  }> = [
    { label: "Planning", icon: "calendar-check", page: "planning" },
    { label: "Forum", icon: "messages", page: "forum" },
    { label: "Présence", icon: "clipboard-check", page: "presence" },
    {
      label: "Disponibilités",
      icon: "calendar-plus",
      page: "disponibilites",
      span: true,
    },
  ];

  return (
    <div
      className="fu3"
      style={{ display: "flex", flexDirection: "column", gap: 16 }}
    >
      <div
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
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--text3)",
              textTransform: "uppercase",
              letterSpacing: "1px",
            }}
          >
            Mes disponibilités
          </div>
          <button
            onClick={() => onNav("disponibilites")}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: accent,
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Modifier →
          </button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {availabilities.map((date) => (
            <span
              key={date}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                padding: "6px 12px",
                borderRadius: 40,
                background: "var(--ens-dim)",
                color: accent,
                border: `1px solid ${accent}30`,
              }}
            >
              {new Date(date).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
              })}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          background: "var(--surface)",
          border: `1px solid ${accent}20`,
          borderRadius: "var(--r-xl)",
          padding: "20px 22px",
        }}
      >
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
          Règle de participation
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <span
            style={{
              fontSize: 40,
              fontWeight: 800,
              color: accent,
              letterSpacing: "-2px",
            }}
          >
            {supervisedCount}
          </span>
          <span style={{ color: "var(--text2)", fontSize: 14 }}>
            sujet(s) × 3 =
          </span>
          <span
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "var(--text)",
              letterSpacing: "-1px",
            }}
          >
            {required}
          </span>
        </div>
        <div
          style={{
            height: 6,
            background: "var(--bg3)",
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progressPct}%`,
              background: accent,
              borderRadius: 3,
              transition: "width 0.5s ease",
            }}
          />
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--text3)",
            marginTop: 8,
          }}
        >
          {total}/{required} participations effectuées
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {quickActions.map((action) => (
          <button
            key={action.page}
            onClick={() => onNav(action.page)}
            style={{
              padding: "14px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-md)",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              transition: "all 0.15s",
              textAlign: "left",
              gridColumn: action.span ? "span 2" : "auto",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `${accent}40`;
              e.currentTarget.style.background = "var(--ens-dim)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.background = "var(--surface)";
            }}
          >
            <Icon name={action.icon} size={18} color={accent} strokeWidth={2} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
