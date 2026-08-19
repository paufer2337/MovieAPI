import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type SyntheticEvent,
} from "react";
import {
  AuthApiError,
  loginAdmin,
  type AuthSession,
} from "../services/auth";
import "./AdminLoginDialog.css";

type AdminLoginDialogProps = {
  onAuthenticated: (session: AuthSession) => void;
  onCancel: () => void;
};

export function AdminLoginDialog({
  onAuthenticated,
  onCancel,
}: AdminLoginDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.showModal();
    usernameRef.current?.focus();

    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  function requestClose() {
    if (!isSubmitting) onCancel();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const session = await loginAdmin(username.trim(), password);
      setPassword("");
      onAuthenticated(session);
    } catch (error) {
      setPassword("");
      setErrorMessage(
        error instanceof AuthApiError && error.status === 401
          ? "Invalid username or password."
          : error instanceof Error
            ? error.message
            : "Could not log in. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="admin-login-dialog"
      aria-labelledby="admin-login-title"
      aria-describedby="admin-login-description"
      onCancel={(event: SyntheticEvent<HTMLDialogElement>) => {
        event.preventDefault();
        requestClose();
      }}
    >
      <div className="admin-login-header">
        <div>
          <p>CinematheQue administration</p>
          <h2 id="admin-login-title">Admin login</h2>
        </div>
        <button
          className="admin-login-close"
          type="button"
          aria-label="Close admin login"
          disabled={isSubmitting}
          onClick={requestClose}
        >
          ×
        </button>
      </div>

      <p id="admin-login-description" className="admin-login-description">
        Sign in with the configured administrator account.
      </p>

      <form className="admin-login-form" onSubmit={handleSubmit}>
        <fieldset disabled={isSubmitting}>
          <legend className="visually-hidden">Administrator credentials</legend>

          <label htmlFor="admin-username">Username</label>
          <input
            ref={usernameRef}
            id="admin-username"
            name="username"
            type="text"
            value={username}
            autoComplete="username"
            required
            onChange={(event) => setUsername(event.target.value)}
          />

          <label htmlFor="admin-password">Password</label>
          <input
            id="admin-password"
            name="password"
            type="password"
            value={password}
            autoComplete="current-password"
            required
            onChange={(event) => setPassword(event.target.value)}
          />

          {errorMessage && (
            <p className="admin-login-error" role="alert">
              {errorMessage}
            </p>
          )}

          <div className="admin-login-actions">
            <button type="button" onClick={requestClose}>
              Cancel
            </button>
            <button type="submit">
              {isSubmitting ? "Logging in…" : "Log in"}
            </button>
          </div>
        </fieldset>
      </form>
    </dialog>
  );
}
