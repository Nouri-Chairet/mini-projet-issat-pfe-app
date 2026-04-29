import Icon from "../Icon";

/*
  LoginFormPanel — the right-hand login form. Stateless: receives all
  values + handlers from the useLoginForm hook through props.
*/

interface LoginFormPanelProps {
  email: string;
  password: string;
  error: string;
  message: string;
  isLoggingIn: boolean;
  isResetting: boolean;
  onEmailChange: (next: string) => void;
  onPasswordChange: (next: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  onForgotPassword: () => void | Promise<void>;
}

const inputBaseStyle: React.CSSProperties = {
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
};

const focusInput = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = "var(--gold)";
  e.target.style.boxShadow = "0 0 0 3px var(--gold-glow)";
  e.target.style.background = "var(--bg3)";
};

const blurInput = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = "var(--border2)";
  e.target.style.boxShadow = "none";
  e.target.style.background = "var(--bg2)";
};

export const LoginFormPanel = ({
  email,
  password,
  error,
  message,
  isLoggingIn,
  isResetting,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onForgotPassword,
}: LoginFormPanelProps) => (
  <div
    className="login-form-wrap"
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
  >
    <div className="fu2" style={{ width: "100%", maxWidth: 400 }}>
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
            width: 40,
            height: 40,
            borderRadius: 10,
            background:
              "linear-gradient(135deg, var(--gold), var(--gold-deep))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--bg)",
          }}
        >
          <Icon name="graduation" size={18} strokeWidth={2.2} />
        </div>
        <span
          style={{
            fontWeight: 700,
            fontSize: 17,
            letterSpacing: "-0.02em",
            fontFamily: "var(--font-display)",
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
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="shield" size={12} color="var(--gold)" />
          Connexion sécurisée
        </div>
        <h2
          style={{
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            marginBottom: 10,
            fontFamily: "var(--font-display)",
          }}
        >
          Bon retour parmi nous.
        </h2>
        <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.6 }}>
          Accédez à votre espace selon votre rôle —{" "}
          <span style={{ color: "var(--gold)" }}>admin</span>,{" "}
          <span style={{ color: "var(--blue-soft)" }}>enseignant</span> ou{" "}
          <span style={{ color: "var(--blue-soft)" }}>étudiant</span>.
        </p>
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 18 }}>
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
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text3)",
                pointerEvents: "none",
              }}
            >
              <Icon name="mail" size={14} />
            </span>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => onEmailChange(event.target.value)}
              placeholder="prenom.nom@issatso.tn"
              autoComplete="email"
              style={{ ...inputBaseStyle, paddingLeft: 40 }}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>
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
              onClick={onForgotPassword}
              disabled={isResetting}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--blue-soft)",
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.3px",
                cursor: isResetting ? "wait" : "pointer",
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--gold)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--blue-soft)";
              }}
            >
              {isResetting ? "Envoi…" : "Oublié ?"}
            </button>
          </div>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text3)",
                pointerEvents: "none",
              }}
            >
              <Icon name="key" size={14} />
            </span>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
              placeholder="••••••••••"
              autoComplete="current-password"
              style={{ ...inputBaseStyle, paddingLeft: 40 }}
              onFocus={focusInput}
              onBlur={blurInput}
            />
          </div>
        </div>

        {/* Feedback */}
        {error ? (
          <div
            role="alert"
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
          >
            <Icon name="alert-circle" size={14} color="var(--danger)" />
            {error}
          </div>
        ) : null}
        {message ? (
          <div
            role="status"
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
            <Icon name="check-circle" size={14} color="var(--blue-soft)" />
            {message}
          </div>
        ) : null}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoggingIn}
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
            cursor: isLoggingIn ? "wait" : "pointer",
            opacity: isLoggingIn ? 0.7 : 1,
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
            if (!isLoggingIn) {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow =
                "0 10px 24px -6px rgba(212,175,55,0.75), inset 0 1px 0 rgba(255,255,255,0.3)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoggingIn) {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 6px 18px -6px rgba(212,175,55,0.6), inset 0 1px 0 rgba(255,255,255,0.25)";
            }
          }}
        >
          {isLoggingIn ? (
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
              Connexion en cours…
            </>
          ) : (
            <>
              Se connecter
              <Icon name="chevron-right" size={14} color="var(--bg)" strokeWidth={2.5} />
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
);

export default LoginFormPanel;
