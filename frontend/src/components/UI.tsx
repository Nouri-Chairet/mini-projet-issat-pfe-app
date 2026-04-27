import type { CSSProperties, ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export const Card = ({ children, style = {}, className = "" }: CardProps) => (
  <div
    className={className}
    style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r-lg)",
      ...style,
    }}
  >
    {children}
  </div>
);

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
      gap: 5,
      padding: "3px 10px",
      borderRadius: 40,
      background: bg,
      color,
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      fontWeight: 500,
      textTransform: "uppercase",
      letterSpacing: "0.8px",
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

interface StatusTagProps {
  statut: "planifié" | "validé" | "en attente";
}

export const StatusTag = ({ statut }: StatusTagProps) => {
  const map = {
    planifié: { color: "var(--etu-accent)", bg: "var(--etu-dim)" },
    validé: { color: "var(--chef-accent)", bg: "var(--chef-dim)" },
    "en attente": { color: "var(--warning)", bg: "rgba(255,181,71,0.08)" },
  };

  const s = map[statut];
  return (
    <Tag color={s.color} bg={s.bg}>
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: s.color,
          display: "inline-block",
          animation: statut === "en attente" ? "pulse 2s infinite" : "none",
        }}
      />
      {statut}
    </Tag>
  );
};

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
      borderRadius: Math.round(size * 0.28),
      background: `${accent}18`,
      border: `1px solid ${accent}35`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: accent,
      fontWeight: 800,
      fontSize: size * 0.33,
      flexShrink: 0,
    }}
  >
    {initials}
  </div>
);

interface BtnProps {
  children: ReactNode;
  onClick?: () => void;
  accent?: string;
  variant?: "fill" | "ghost" | "muted";
  style?: CSSProperties;
  disabled?: boolean;
}

export const Btn = ({
  children,
  onClick,
  accent = "#00e5a0",
  variant = "fill",
  style = {},
  disabled = false,
}: BtnProps) => {
  const base: CSSProperties = {
    padding: "10px 20px",
    borderRadius: "var(--r-md)",
    fontWeight: 700,
    fontSize: 13,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.5 : 1,
    transition: "all 0.15s",
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    border: "none",
    fontFamily: "inherit",
    letterSpacing: "0.2px",
    ...style,
  };

  if (variant === "fill") {
    return (
      <button
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        style={{ ...base, background: accent, color: "#000" }}
        onMouseEnter={(e) => {
          if (!disabled) e.currentTarget.style.opacity = "0.88";
        }}
        onMouseLeave={(e) => {
          if (!disabled) e.currentTarget.style.opacity = "1";
        }}
      >
        {children}
      </button>
    );
  }

  if (variant === "ghost") {
    return (
      <button
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        style={{
          ...base,
          background: "transparent",
          color: accent,
          border: `1px solid ${accent}40`,
        }}
        onMouseEnter={(e) => {
          if (!disabled) e.currentTarget.style.background = `${accent}12`;
        }}
        onMouseLeave={(e) => {
          if (!disabled) e.currentTarget.style.background = "transparent";
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        ...base,
        background: "var(--surface2)",
        color: "var(--text2)",
        border: "1px solid var(--border2)",
      }}
    >
      {children}
    </button>
  );
};

interface StatProps {
  label: string;
  value: string | number;
  accent: string;
  sub?: string;
}

export const Stat = ({ label, value, accent, sub }: StatProps) => (
  <div
    style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--r-lg)",
      padding: "20px 22px",
      position: "relative",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        background: accent,
        opacity: 0.6,
      }}
    />
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "1.5px",
        color: "var(--text3)",
        marginBottom: 10,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 36,
        fontWeight: 800,
        color: "var(--text)",
        letterSpacing: "-2px",
        lineHeight: 1,
        fontFamily: "var(--font-display)",
      }}
    >
      {value}
    </div>
    {sub && (
      <div
        style={{
          marginTop: 8,
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: accent,
        }}
      >
        {sub}
      </div>
    )}
  </div>
);

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
          letterSpacing: "1px",
          color: "var(--text2)",
          display: "block",
          marginBottom: 7,
        }}
      >
        {label}
      </label>
    )}
    <input
      {...props}
      style={{
        width: "100%",
        padding: "11px 15px",
        background: "var(--bg2)",
        border: "1px solid var(--border2)",
        borderRadius: "var(--r-md)",
        color: "var(--text)",
        outline: "none",
        transition: "border 0.2s",
        ...props.style,
      }}
      onFocus={(e) => {
        e.target.style.borderColor = `${accent || "#00e5a0"}70`;
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "var(--border2)";
      }}
    />
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  accent?: string;
  children: ReactNode;
}

export const Select = ({ label, children, ...props }: SelectProps) => (
  <div>
    {label && (
      <label
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "1px",
          color: "var(--text2)",
          display: "block",
          marginBottom: 7,
        }}
      >
        {label}
      </label>
    )}
    <select
      {...props}
      style={{
        width: "100%",
        padding: "11px 15px",
        background: "var(--bg2)",
        border: "1px solid var(--border2)",
        borderRadius: "var(--r-md)",
        color: "var(--text)",
        outline: "none",
        appearance: "none",
      }}
    >
      {children}
    </select>
  </div>
);

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  accent?: string;
}

export const Modal = ({ title, onClose, children, accent }: ModalProps) => (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      zIndex: 300,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      backdropFilter: "blur(4px)",
      animation: "fadeIn 0.2s ease",
    }}
  >
    <div
      style={{
        background: "var(--bg2)",
        border: `1px solid ${accent ? `${accent}33` : "var(--border2)"}`,
        borderRadius: "var(--r-xl)",
        padding: 28,
        width: "100%",
        maxWidth: 520,
        maxHeight: "90vh",
        overflowY: "auto",
        animation: "fadeUp 0.3s cubic-bezier(0.16,1,0.3,1) both",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.5px" }}>
          {title}
        </h2>
        <button
          onClick={onClose}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 9,
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--text2)",
            fontSize: 16,
          }}
        >
          ×
        </button>
      </div>
      {children}
    </div>
  </div>
);
