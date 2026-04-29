import { useCallback, useState } from "react";

/*
  useLoginForm — owns email/password state, validation, login + forgot
  password flows, and presents typed error/info messages.

  The page-level Login component is now purely presentation: it reads
  values from this hook and forwards user actions back into it.
*/

interface UseLoginFormArgs {
  onLogin: (email: string, password: string) => Promise<void>;
  onForgotPassword: (email: string) => Promise<string>;
}

export function useLoginForm({ onLogin, onForgotPassword }: UseLoginFormArgs) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const clearFeedback = () => {
    setError("");
    setMessage("");
  };

  const submitLogin = useCallback(
    async (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      clearFeedback();

      if (!email || !password) {
        setError("Veuillez remplir email et mot de passe.");
        return;
      }

      setIsLoggingIn(true);
      try {
        await onLogin(email, password);
      } catch {
        setError("Identifiants invalides.");
      } finally {
        setIsLoggingIn(false);
      }
    },
    [email, password, onLogin],
  );

  const triggerForgotPassword = useCallback(async () => {
    clearFeedback();

    if (!email) {
      setError(
        "Saisissez votre email pour recevoir le lien de réinitialisation.",
      );
      return;
    }

    setIsResetting(true);
    try {
      const detail = await onForgotPassword(email);
      setMessage(detail);
    } catch {
      setError("Impossible d'envoyer l'email de réinitialisation.");
    } finally {
      setIsResetting(false);
    }
  }, [email, onForgotPassword]);

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    message,
    isLoggingIn,
    isResetting,
    submitLogin,
    triggerForgotPassword,
  };
}
