import { useState } from "react";

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onForgotPassword: (email: string) => Promise<string>;
}

export default function Login({ onLogin, onForgotPassword }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);

  const submitLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email || !password) {
      setError("Veuillez remplir email et mot de passe.");
      return;
    }

    setIsLoading(true);
    try {
      await onLogin(email, password);
    } catch {
      setError("Identifiants invalides.");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerForgotPassword = async () => {
    setError("");
    setMessage("");

    if (!email) {
      setError(
        "Saisissez votre email pour recevoir le lien de réinitialisation.",
      );
      return;
    }

    setIsResetLoading(true);
    try {
      const detail = await onForgotPassword(email);
      setMessage(detail);
    } catch {
      setError("Impossible d'envoyer l'email de réinitialisation.");
    } finally {
      setIsResetLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "var(--bg)",
        color: "var(--text)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient aurora glows */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "-20%",
          left: "-10%",
          width: 600,
          height: 600,
          background:
            "radial-gradient(circle, var(--gold-glow), transparent 65%)",
          filter: "blur(40px)",
          pointerEvents: "none",
          animation: "auroraShift 12s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden
        style={{
          position: "absolute",
          bottom: "-25%",
          right: "-10%",
          width: 700,
          height: 700,
          background:
            "radial-gradient(circle, var(--blue-glow), transparent 65%)",
          filter: "blur(50px)",
          pointerEvents: "none",
          animation: "auroraShift 14s ease-in-out infinite reverse",
        }}
      />

      {/* ============== LEFT — Branding panel ============== */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "44px 56px",
          borderRight: "1px solid var(--border)",
          position: "relative",
          zIndex: 1,
        }}
        className="login-brand"
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background:
                "linear-gradient(135deg, var(--gold), var(--gold-deep))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--bg)",
              fontWeight: 800,
              fontSize: 18,
              fontFamily: "var(--font-mono)",
              boxShadow:
                "0 0 0 1px rgba(212,175,55,0.35), 0 8px 24px -8px rgba(212,175,55,0.55)",
              letterSpacing: "-0.04em",
            }}
          >
            {"</>"}
          </div>
          <div style={{ lineHeight: 1.15 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: "-0.025em",
              }}
            >
              GestionPFE
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
        <div className="fu" style={{ maxWidth: 540 }}>
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
          <h1
            style={{
              fontSize: "clamp(36px, 5vw, 56px)",
              fontWeight: 700,
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
              marginBottom: 20,
            }}
          >
            Pilotez vos
            <br />
            <span
              style={{
                fontFamily: "var(--font-serif)",
                fontStyle: "italic",
                fontWeight: 500,
                color: "var(--gold)",
              }}
            >
              projets de fin d&apos;études
            </span>
            <br />
            avec précision.
          </h1>
          <p
            style={{
              color: "var(--text2)",
              fontSize: 15,
              lineHeight: 1.65,
              maxWidth: 460,
              marginBottom: 36,
            }}
          >
            Une plateforme premium pour les étudiants, enseignants et chefs de
            département. Sujets, soutenances, jurys, plannings — tout au même
            endroit, en temps réel.
          </p>

          {/* Feature pills */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { label: "Sujets PFE", color: "var(--gold)" },
              { label: "Planning intelligent", color: "var(--blue)" },
              { label: "Forum académique", color: "var(--blue-soft)" },
              { label: "Jurys & soutenances", color: "var(--gold-soft)" },
            ].map((feature) => (
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
              gestion-pfe ~ session
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
              <span style={{ color: "var(--blue-soft)" }}>›</span> securing
              session with TLS 1.3
            </div>
            <div style={{ color: "var(--gold)" }}>
              <span>✓</span> ready to authenticate
            </div>
          </div>
        </div>
      </div>

      {/* ============== RIGHT — Login form ============== */}
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "44px 40px",
          position: "relative",
          zIndex: 1,
        }}
        className="login-form-wrap"
      >
        <div
          className="fu2"
          style={{
            width: "100%",
            maxWidth: 400,
          }}
        >
          {/* Mobile logo */}
          <div
            className="login-mobile-logo"
            style={{
              display: "none",
              alignItems: "center",
              gap: 12,
              marginBottom: 28,
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background:
                  "linear-gradient(135deg, var(--gold), var(--gold-deep))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--bg)",
                fontWeight: 800,
                fontSize: 15,
                fontFamily: "var(--font-mono)",
              }}
            >
              {"</>"}
            </div>
            <span
              style={{
                fontWeight: 700,
                fontSize: 17,
                letterSpacing: "-0.02em",
              }}
            >
              GestionPFE
            </span>
          </div>

          <div style={{ marginBottom: 28 }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--gold)",
                textTransform: "uppercase",
                letterSpacing: "2px",
                marginBottom: 12,
              }}
            >
              ◉ Connexion sécurisée
            </div>
            <h2
              style={{
                fontSize: 32,
                fontWeight: 700,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                marginBottom: 10,
              }}
            >
              Bon retour parmi nous.
            </h2>
            <p
              style={{
                color: "var(--text2)",
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              Accédez à votre espace selon votre rôle —{" "}
              <span style={{ color: "var(--gold)" }}>admin</span>,{" "}
              <span style={{ color: "var(--blue-soft)" }}>enseignant</span> ou{" "}
              <span style={{ color: "var(--blue-soft)" }}>étudiant</span>.
            </p>
          </div>

          <form onSubmit={submitLogin} style={{ display: "grid", gap: 18 }}>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                style={{
                  display: "block",
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  color: "var(--text2)",
                  marginBottom: 8,
                }}
              >
                Email institutionnel
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="prenom.nom@issatso.tn"
                autoComplete="email"
                style={{
                  width: "100%",
                  padding: "13px 16px",
                  background: "var(--bg2)",
                  border: "1px solid var(--border2)",
                  borderRadius: "var(--r-md)",
                  color: "var(--text)",
                  fontSize: 14,
                  outline: "none",
                  transition:
                    "border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--gold)";
                  e.target.style.boxShadow = "0 0 0 3px var(--gold-glow)";
                  e.target.style.background = "var(--bg3)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border2)";
                  e.target.style.boxShadow = "none";
                  e.target.style.background = "var(--bg2)";
                }}
              />
            </div>

            {/* Password */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                }}
              >
                <label
                  htmlFor="password"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    color: "var(--text2)",
                  }}
                >
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={triggerForgotPassword}
                  disabled={isResetLoading}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--blue-soft)",
                    fontSize: 11,
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.3px",
                    cursor: isResetLoading ? "wait" : "pointer",
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "var(--gold)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "var(--blue-soft)";
                  }}
                >
                  {isResetLoading ? "Envoi..." : "Oublié ?"}
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••••"
                autoComplete="current-password"
                style={{
                  width: "100%",
                  padding: "13px 16px",
                  background: "var(--bg2)",
                  border: "1px solid var(--border2)",
                  borderRadius: "var(--r-md)",
                  color: "var(--text)",
                  fontSize: 14,
                  outline: "none",
                  transition:
                    "border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--gold)";
                  e.target.style.boxShadow = "0 0 0 3px var(--gold-glow)";
                  e.target.style.background = "var(--bg3)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border2)";
                  e.target.style.boxShadow = "none";
                  e.target.style.background = "var(--bg2)";
                }}
              />
            </div>

            {/* Feedback */}
            {error ? (
              <div
                style={{
                  padding: "10px 12px",
                  background: "var(--danger-dim)",
                  border: "1px solid rgba(194,84,80,0.30)",
                  borderRadius: "var(--r-md)",
                  color: "var(--danger)",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
                role="alert"
              >
                <span style={{ fontSize: 12 }}>⊘</span>
                {error}
              </div>
            ) : null}
            {message ? (
              <div
                style={{
                  padding: "10px 12px",
                  background: "var(--blue-dim)",
                  border: "1px solid rgba(91,163,199,0.30)",
                  borderRadius: "var(--r-md)",
                  color: "var(--blue-soft)",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 12 }}>✓</span>
                {message}
              </div>
            ) : null}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              style={{
                marginTop: 6,
                background:
                  "linear-gradient(180deg, var(--gold), var(--gold-deep))",
                color: "var(--bg)",
                border: "1px solid var(--gold)",
                borderRadius: "var(--r-md)",
                padding: "13px 18px",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.01em",
                cursor: isLoading ? "wait" : "pointer",
                opacity: isLoading ? 0.7 : 1,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                boxShadow:
                  "0 6px 18px -6px rgba(212,175,55,0.6), inset 0 1px 0 rgba(255,255,255,0.25)",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    "0 10px 24px -6px rgba(212,175,55,0.75), inset 0 1px 0 rgba(255,255,255,0.3)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 18px -6px rgba(212,175,55,0.6), inset 0 1px 0 rgba(255,255,255,0.25)";
                }
              }}
            >
              {isLoading ? (
                <>
                  <span
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      border: "2px solid var(--bg)",
                      borderTopColor: "transparent",
                      animation: "spin 0.7s linear infinite",
                    }}
                  />
                  Connexion en cours...
                </>
              ) : (
                <>
                  Se connecter
                  <span style={{ fontSize: 14 }}>→</span>
                </>
              )}
            </button>

            <div
              style={{
                marginTop: 8,
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--text3)",
                letterSpacing: "0.8px",
                textAlign: "center",
              }}
            >
              Sécurisé par chiffrement de bout en bout · ISSAT 2026
            </div>
          </form>
        </div>
      </div>

      {/* Responsive: hide brand panel on small screens, center the form */}
      <style>{`
        @media (max-width: 960px) {
          .login-brand { display: none !important; }
          .login-form-wrap { max-width: 100% !important; }
          .login-mobile-logo { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
