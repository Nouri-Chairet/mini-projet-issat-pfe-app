import type { CSSProperties, ReactNode } from "react";

/*
  GlassCard — opt-in liquid-glass surface.

  Used selectively (login form, presence warning, dry-run preview, key
  dashboard tiles) — NOT a default replacement for `Card`. Heavy
  backdrop-filter on every card kills perf, so this is restricted to
  ~6-10 places across the app.
*/

interface GlassCardProps {
  children: ReactNode;
  accent?: string;
  intensity?: "soft" | "strong";
  className?: string;
  style?: CSSProperties;
  padding?: number | string;
  onClick?: () => void;
}

export const GlassCard = ({
  children,
  accent,
  intensity = "soft",
  className = "",
  style,
  padding = 18,
  onClick,
}: GlassCardProps) => {
  const isStrong = intensity === "strong";
  const accentColor = accent || "rgba(245, 245, 220, 0.18)";

  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        position: "relative",
        background: isStrong
          ? "linear-gradient(180deg, rgba(245,245,220,0.10), rgba(245,245,220,0.04))"
          : "linear-gradient(180deg, rgba(245,245,220,0.06), rgba(245,245,220,0.02))",
        backdropFilter: `blur(${isStrong ? 22 : 16}px) saturate(1.4)`,
        WebkitBackdropFilter: `blur(${isStrong ? 22 : 16}px) saturate(1.4)`,
        border: `1px solid ${accent ? accent + "40" : "var(--border2)"}`,
        borderRadius: "var(--r-lg)",
        padding,
        boxShadow:
          "inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 12px 40px rgba(0, 0, 0, 0.35)",
        overflow: "hidden",
        ...style,
      }}
    >
      {accent ? (
        <span
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 24,
            right: 24,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
            pointerEvents: "none",
          }}
        />
      ) : null}
      {children}
    </div>
  );
};

export default GlassCard;
