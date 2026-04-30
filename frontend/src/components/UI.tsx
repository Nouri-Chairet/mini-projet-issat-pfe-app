import type { CSSProperties, ReactNode } from "react";

/* ----------------------------------------------------------------
   Card — premium elevated surface with subtle gradient border
----------------------------------------------------------------- */
interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
}

export const Card = ({
  children,
  style = {},
  className = "",
  onClick,
}: CardProps) => (
  <div
    onClick={onClick}
    className={className}
    style={{
      background:
        "linear-gradient(180deg, rgba(245,245,220,0.025), rgba(245,245,220,0.005)), var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r-lg)",
      boxShadow: "var(--shadow-md)",
      transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
      ...style,
    }}
  >
    {children}
  </div>
);

/* ----------------------------------------------------------------
   Tag — refined chip with mono uppercase
----------------------------------------------------------------- */
interface TagProps {
  children: ReactNode;
  color?: string;
  bg?: string;
}

export const Tag = ({
  children,
  color = "var(--text2)",
  bg = "var(--surface2)",
}: TagProps) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      padding: "4px 10px",
      borderRadius: 999,
      background: bg,
      color,
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "1px",
      whiteSpace: "nowrap",
      border: "1px solid var(--border)",
    }}
  >
    {children}
  </span>
);

/* ----------------------------------------------------------------
   StatusTag
----------------------------------------------------------------- */
interface StatusTagProps {
  statut: "planifié" | "validé" | "en attente";
}

export const StatusTag = ({ statut }: StatusTagProps) => {
  const map = {
    planifié: { color: "var(--blue-soft)", bg: "var(--blue-dim)" },
    validé: { color: "var(--gold)", bg: "var(--gold-dim)" },
    "en attente": { color: "var(--gold-soft)", bg: "rgba(232, 199, 102, 0.08)" },
  };

  const s = map[statut];
  return (
    <Tag color={s.color} bg={s.bg}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: s.color,
          display: "inline-block",
          boxShadow: `0 0 8px ${s.color}`,
          animation: statut === "en attente" ? "pulse 2s infinite" : "none",
        }}
      />
      {statut}
    </Tag>
  );
};

/* ----------------------------------------------------------------
   Avatar
----------------------------------------------------------------- */
interface AvatarProps {
  initials: string;
  accent: string;
  size?: number;
}

export const Avatar = ({ initials, accent, size = 36 }: AvatarProps) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: Math.round(size * 0.32),
      background: `linear-gradient(135deg, ${accent}28, ${accent}10)`,
      border: `1px solid ${accent}40`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: accent,
      fontWeight: 700,
      fontSize: Math.round(size * 0.36),
      flexShrink: 0,
      letterSpacing: "-0.02em",
      boxShadow: `inset 0 1px 0 rgba(245,245,220,0.06)`,
    }}
  >
    {initials}
  </div>
);

/* ----------------------------------------------------------------
   Btn — premium with gold/blue variants
----------------------------------------------------------------- */
interface BtnProps {
  children: ReactNode;
  onClick?: () => void;
  accent?: string;
  variant?: "fill" | "ghost" | "muted";
  style?: CSSProperties;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export const Btn = ({
  children,
  onClick,
  accent = "var(--gold)",
  variant = "fill",
  style = {},
  disabled = false,
  type = "button",
}: BtnProps) => {
  const base: CSSProperties = {
    padding: "10px 18px",
    borderRadius: "var(--r-md)",
    fontWeight: 600,
    fontSize: 13,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transition: "all 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    border: "1px solid transparent",
    fontFamily: "inherit",
    letterSpacing: "0.01em",
    whiteSpace: "nowrap",
    ...style,
  };

  if (variant === "fill") {
    return (
      <button
        type={type}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        style={{
          ...base,
          background: `linear-gradient(180deg, ${accent}, ${accent})`,
          color: "var(--bg)",
          borderColor: accent,
          boxShadow: `0 4px 14px -4px ${accent}80, inset 0 1px 0 rgba(255,255,255,0.18)`,
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = `0 8px 22px -6px ${accent}, inset 0 1px 0 rgba(255,255,255,0.25)`;
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = `0 4px 14px -4px ${accent}80, inset 0 1px 0 rgba(255,255,255,0.18)`;
          }
        }}
      >
        {children}
      </button>
    );
  }

  if (variant === "ghost") {
    return (
      <button
        type={type}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        style={{
          ...base,
          background: "transparent",
          color: accent,
          border: `1px solid ${accent}50`,
        }}
        onMouseEnter={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = `${accent}14`;
            e.currentTarget.style.borderColor = accent;
          }
        }}
        onMouseLeave={(e) => {
          if (!disabled) {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.borderColor = `${accent}50`;
          }
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        ...base,
        background: "var(--surface2)",
        color: "var(--text2)",
        border: "1px solid var(--border2)",
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "var(--surface3)";
          e.currentTarget.style.color = "var(--text)";
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = "var(--surface2)";
          e.currentTarget.style.color = "var(--text2)";
        }
      }}
    >
      {children}
    </button>
  );
};

/* ----------------------------------------------------------------
   Stat — premium KPI card with gradient accent line
----------------------------------------------------------------- */
interface StatProps {
  label: string;
  value: string | number;
  accent: string;
  sub?: string;
}

export const Stat = ({ label, value, accent, sub }: StatProps) => (
  <div
    style={{
      background:
        "linear-gradient(180deg, rgba(245,245,220,0.03), rgba(245,245,220,0.005)), var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r-lg)",
      padding: "22px 24px",
      position: "relative",
      overflow: "hidden",
      boxShadow: "var(--shadow-md)",
      transition: "transform 0.2s ease, border-color 0.2s ease",
    }}
  >
    {/* Gradient accent bar */}
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
      }}
    />
    {/* Soft accent glow */}
    <div
      style={{
        position: "absolute",
        top: -40,
        right: -40,
        width: 140,
        height: 140,
        background: `radial-gradient(circle, ${accent}15, transparent 70%)`,
        pointerEvents: "none",
      }}
    />
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "1.6px",
        color: "var(--text3)",
        marginBottom: 12,
        position: "relative",
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 38,
        fontWeight: 700,
        color: "var(--text)",
        letterSpacing: "-0.04em",
        lineHeight: 1,
        fontFamily: "var(--font-display)",
        position: "relative",
      }}
    >
      {value}
    </div>
    {sub && (
      <div
        style={{
          marginTop: 10,
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: accent,
          position: "relative",
          letterSpacing: "0.02em",
        }}
      >
        {sub}
      </div>
    )}
  </div>
);

/* ----------------------------------------------------------------
   Input
----------------------------------------------------------------- */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  accent?: string;
}

export const Input = ({ label, accent, ...props }: InputProps) => (
  <div>
    {label && (
      <label
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "1.2px",
          color: "var(--text2)",
          display: "block",
          marginBottom: 8,
        }}
      >
        {label}
      </label>
    )}
    <input
      {...props}
      style={{
        width: "100%",
        padding: "12px 15px",
        background: "var(--bg2)",
        border: "1px solid var(--border2)",
        borderRadius: "var(--r-md)",
        color: "var(--text)",
        outline: "none",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
        ...props.style,
      }}
      onFocus={(e) => {
        const c = accent || "var(--gold)";
        e.target.style.borderColor = c;
        e.target.style.boxShadow = `0 0 0 3px ${c}22`;
        e.target.style.background = "var(--bg3)";
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "var(--border2)";
        e.target.style.boxShadow = "none";
        e.target.style.background = "var(--bg2)";
        props.onBlur?.(e);
      }}
    />
  </div>
);

/* ----------------------------------------------------------------
   Select
----------------------------------------------------------------- */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  accent?: string;
  children: ReactNode;
}

export const Select = ({ label, accent, children, ...props }: SelectProps) => (
  <div>
    {label && (
      <label
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "1.2px",
          color: "var(--text2)",
          display: "block",
          marginBottom: 8,
        }}
      >
        {label}
      </label>
    )}
    <div style={{ position: "relative" }}>
      <select
        {...props}
        style={{
          width: "100%",
          padding: "12px 36px 12px 15px",
          background: "var(--bg2)",
          border: "1px solid var(--border2)",
          borderRadius: "var(--r-md)",
          color: "var(--text)",
          outline: "none",
          appearance: "none",
          cursor: "pointer",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        }}
        onFocus={(e) => {
          const c = accent || "var(--gold)";
          e.target.style.borderColor = c;
          e.target.style.boxShadow = `0 0 0 3px ${c}22`;
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "var(--border2)";
          e.target.style.boxShadow = "none";
          props.onBlur?.(e);
        }}
      >
        {children}
      </select>
      <span
        aria-hidden
        style={{
          position: "absolute",
          right: 14,
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--text3)",
          fontSize: 10,
          pointerEvents: "none",
          fontFamily: "var(--font-mono)",
        }}
      >
        ▾
      </span>
    </div>
  </div>
);

/* ----------------------------------------------------------------
   Modal — refined with glass + gold accent border
----------------------------------------------------------------- */
interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  accent?: string;
}

export const Modal = ({ title, onClose, children, accent }: ModalProps) => {
  const accentColor = accent || "var(--gold)";
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(4, 15, 15, 0.78)",
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background:
            "linear-gradient(180deg, rgba(245,245,220,0.035), rgba(245,245,220,0.008)), var(--bg2)",
          border: `1px solid ${accentColor}30`,
          borderRadius: "var(--r-2xl)",
          padding: 30,
          width: "100%",
          maxWidth: 540,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: `var(--shadow-lg), 0 0 0 1px ${accentColor}15`,
          animation: "fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both",
          position: "relative",
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 24,
            right: 24,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 22,
          }}
        >
          <h2
            style={{
              fontSize: 19,
              fontWeight: 700,
              letterSpacing: "-0.025em",
              color: "var(--text)",
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border2)",
              borderRadius: 10,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--text2)",
              fontSize: 16,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--text)";
              e.currentTarget.style.background = "var(--surface2)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--text2)";
              e.currentTarget.style.background = "var(--surface)";
            }}
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};
