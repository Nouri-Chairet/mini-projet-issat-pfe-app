import type { CSSProperties } from "react";

/*
  ProfileAvatar — small reusable avatar that displays initials in a
  role-tinted glass tile. Used in the topbar and any list view that
  needs a consistent identity chip.
*/

interface ProfileAvatarProps {
  name?: string;
  initials?: string;
  accent?: string;
  size?: number;
  style?: CSSProperties;
}

const computeInitials = (name?: string, fallback?: string) => {
  if (fallback) return fallback.toUpperCase();
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const ProfileAvatar = ({
  name,
  initials,
  accent = "var(--gold)",
  size = 36,
  style,
}: ProfileAvatarProps) => {
  const text = computeInitials(name, initials);
  const fontSize = Math.max(11, Math.round(size * 0.36));

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        background: `linear-gradient(135deg, ${accent}28, ${accent}10)`,
        border: `1px solid ${accent}40`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: accent,
        fontWeight: 700,
        fontSize,
        letterSpacing: "-0.02em",
        boxShadow: `0 0 0 3px ${accent}10`,
        flexShrink: 0,
        fontFamily: "var(--font-display)",
        ...style,
      }}
      aria-label={name ? `Avatar de ${name}` : "Avatar"}
    >
      {text}
    </div>
  );
};

export default ProfileAvatar;
