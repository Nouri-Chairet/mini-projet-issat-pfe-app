import LoginBrandPanel from "../components/login/LoginBrandPanel";
import LoginFormPanel from "../components/login/LoginFormPanel";
import { useLoginForm } from "../hooks/useLoginForm";

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onForgotPassword: (email: string) => Promise<string>;
}

/**
 * Login page — thin composition of:
 *   - useLoginForm hook (state + submit + reset handlers)
 *   - LoginBrandPanel (left, hidden on small screens)
 *   - LoginFormPanel (right, mobile logo + form)
 */
export default function Login({ onLogin, onForgotPassword }: LoginProps) {
  const form = useLoginForm({ onLogin, onForgotPassword });

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
          background: "radial-gradient(circle, rgba(212, 175, 55, 0.15), transparent 70%)",
          pointerEvents: "none",
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
          background: "radial-gradient(circle, rgba(46, 120, 157, 0.15), transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <LoginBrandPanel />
      <LoginFormPanel
        email={form.email}
        password={form.password}
        error={form.error}
        message={form.message}
        isLoading={form.isLoggingIn}
        isResetting={form.isResetting}
        onEmailChange={form.setEmail}
        onPasswordChange={form.setPassword}
        onSubmit={form.submitLogin}
        onForgotPassword={form.triggerForgotPassword}
      />

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
