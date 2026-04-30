import Icon from "../Icon";

/*
  LoginBrandPanel — the left-side marketing panel of the login screen.

  Pure presentational. Hidden on viewports < 960px via the responsive
  CSS in Login.tsx (.login-brand class).
*/

const FEATURES = [
  { label: "Sujets PFE", color: "var(--gold)" },
  { label: "Planning intelligent", color: "var(--blue)" },
  { label: "Forum académique", color: "var(--blue-soft)" },
  { label: "Jurys & soutenances", color: "var(--gold-soft)" },
];

export const LoginBrandPanel = () => (
  <div
    className="login-brand"
    style={{
      flex: 1.5,
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      textAlign: "center",
      gap: "60px",
      padding: "44px 56px",
      borderRight: "1px solid var(--border)",
      position: "relative",
      zIndex: 1,
    }}
  >
    {/* Logo */}
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 12,
          background: "linear-gradient(135deg, var(--gold), var(--gold-deep))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--bg)",
          boxShadow:
            "0 0 0 1px rgba(212,175,55,0.35), 0 8px 24px -8px rgba(212,175,55,0.55)",
        }}
      >
        <Icon name="graduation" size={22} strokeWidth={2.2} />
      </div>
      <div style={{ lineHeight: 1.15 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: "-0.025em",
            fontFamily: "var(--font-display)",
          }}
        >
          Issat sousse
        </div>
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "1.6px",
            color: "var(--gold)",
            marginTop: 2,
          }}
        >
          ISSAT · Engineering Suite
        </div>
      </div>
    </div>

    {/* Main copy */}
    <div className="fu" style={{ width: "100%", maxWidth: 800 }}>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--gold)",
          textTransform: "uppercase",
          letterSpacing: "2.5px",
          marginBottom: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <span
          style={{
            width: 24,
            height: 1,
            background: "var(--gold)",
            display: "inline-block",
          }}
        />
        Built for engineers
      </div>
      <div style={{ textAlign: "center", width: "100%", maxWidth: 800 }}>
        <svg viewBox="0 0 700 100" style={{ width: "100%", height: "auto" }}>
          <defs>
            <linearGradient id="welcomeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--gold)" />
              <stop offset="100%" stopColor="var(--gold-deep)" />
            </linearGradient>
          </defs>
          <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            fill="url(#welcomeGrad)"
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: "42px",
              letterSpacing: "-0.04em",
              textTransform: "uppercase"
            }}
          >
            Welcome to ISSAT Sousse
          </text>
        </svg>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        {FEATURES.map((feature) => (
          <span
            key={feature.label}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.5px",
              padding: "6px 12px",
              borderRadius: 999,
              border: `1px solid ${feature.color}35`,
              background: `${feature.color}10`,
              color: feature.color,
            }}
          >
            {feature.label}
          </span>
        ))}
      </div>
    </div>

    {/* Terminal block — developer flourish */}
    <div
      className="fu1"
      style={{
        background: "var(--bg2)",
        border: "1px solid var(--border2)",
        borderRadius: "var(--r-lg)",
        padding: 0,
        maxWidth: 460,
        fontFamily: "var(--font-mono)",
        overflow: "hidden",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 14px",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg3)",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "rgba(194,84,80,0.7)",
          }}
        />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "rgba(212,175,55,0.7)",
          }}
        />
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "rgba(91,163,199,0.7)",
          }}
        />
        <span
          style={{
            marginLeft: 12,
            fontSize: 10,
            color: "var(--text3)",
            letterSpacing: "0.8px",
            textTransform: "uppercase",
          }}
        >
          study-management ~ session
        </span>
      </div>
      <div style={{ padding: "14px 16px", fontSize: 12, lineHeight: 1.85 }}>
        <div style={{ color: "var(--text3)" }}>
          <span style={{ color: "var(--gold)" }}>$</span> auth --connect
        </div>
        <div style={{ color: "var(--text2)" }}>
          <span style={{ color: "var(--blue-soft)" }}>›</span> resolving
          identity provider...
        </div>
        <div style={{ color: "var(--text2)" }}>
          <span style={{ color: "var(--blue-soft)" }}>›</span> securing session
          with TLS 1.3
        </div>
        <div
          style={{
            color: "var(--gold)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="check" size={12} color="var(--gold)" />
          ready to authenticate
        </div>
      </div>
    </div>
  </div>
);

export default LoginBrandPanel;
