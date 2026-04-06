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
      setError("Saisissez votre email pour recevoir le lien de réinitialisation.");
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
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: 20,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--r-lg)",
          padding: 28,
        }}
      >
        <h1
          style={{
            margin: 0,
            marginBottom: 22,
            color: "var(--text)",
            fontSize: 28,
            letterSpacing: "-1px",
          }}
        >
          Connexion
        </h1>

        <form onSubmit={submitLogin} style={{ display: "grid", gap: 12 }}>
          <label style={{ fontSize: 12, color: "var(--text2)" }}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
            }}
            placeholder="email@exemple.com"
            style={{
              width: "100%",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-md)",
              background: "var(--bg2)",
              color: "var(--text)",
              padding: "10px 12px",
              fontSize: 14,
            }}
          />

          <label style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>
            Mot de passe
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
            }}
            placeholder="••••••••"
            style={{
              width: "100%",
              border: "1px solid var(--border)",
              borderRadius: "var(--r-md)",
              background: "var(--bg2)",
              color: "var(--text)",
              padding: "10px 12px",
              fontSize: 14,
            }}
          />

          <button
            type="button"
            onClick={triggerForgotPassword}
            disabled={isResetLoading}
            style={{
              border: "none",
              background: "transparent",
              color: "var(--text2)",
              textAlign: "left",
              padding: 0,
              marginTop: 2,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            {isResetLoading
              ? "Envoi en cours..."
              : "Mot de passe oublié ?"}
          </button>

          {error ? (
            <div style={{ color: "var(--danger)", fontSize: 13 }}>{error}</div>
          ) : null}
          {message ? (
            <div style={{ color: "var(--chef-accent)", fontSize: 13 }}>
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: 4,
              background: "var(--chef-accent)",
              color: "#000",
              border: "none",
              borderRadius: "var(--r-md)",
              padding: "10px 14px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {isLoading ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
