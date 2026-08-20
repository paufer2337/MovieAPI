import { useEffect, useRef, useState } from "react";
import {
  AUTH_SESSION_INVALIDATED_EVENT,
  clearAuthSession,
  getStoredAuthSession,
  invalidateAuthSession,
  type AuthInvalidationReason,
  type AuthSession,
} from "../services/auth";

export function useAuthSession() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(() =>
    getStoredAuthSession(),
  );
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const authButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleInvalidatedSession(event: Event) {
      const reason = (event as CustomEvent<AuthInvalidationReason>).detail;
      setAuthSession(null);
      setIsLoginDialogOpen(false);
      setAuthMessage(
        reason === "expired"
          ? "Your admin session expired. Please log in again."
          : "Your admin session ended because authorization failed.",
      );
    }

    window.addEventListener(
      AUTH_SESSION_INVALIDATED_EVENT,
      handleInvalidatedSession,
    );
    return () =>
      window.removeEventListener(
        AUTH_SESSION_INVALIDATED_EVENT,
        handleInvalidatedSession,
      );
  }, []);

  useEffect(() => {
    if (!authSession) return;

    const millisecondsUntilExpiry =
      Date.parse(authSession.expiresAtUtc) - Date.now();
    if (millisecondsUntilExpiry <= 0) {
      invalidateAuthSession("expired");
      return;
    }

    const timeoutId = window.setTimeout(
      () => invalidateAuthSession("expired"),
      millisecondsUntilExpiry,
    );
    return () => window.clearTimeout(timeoutId);
  }, [authSession]);

  function handleAuthenticated(session: AuthSession) {
    setAuthSession(session);
    setIsLoginDialogOpen(false);
    setAuthMessage("");
    requestAnimationFrame(() => authButtonRef.current?.focus());
  }

  function handleAuthAction() {
    setAuthMessage("");

    if (authSession) {
      clearAuthSession();
      setAuthSession(null);
      setAuthMessage("You have logged out of admin mode.");
      return;
    }

    setIsLoginDialogOpen(true);
  }

  function handleLoginCancel() {
    setIsLoginDialogOpen(false);
    requestAnimationFrame(() => authButtonRef.current?.focus());
  }

  return {
    authButtonRef,
    authMessage,
    handleAuthAction,
    handleAuthenticated,
    handleLoginCancel,
    isAdminMode: authSession !== null,
    isLoginDialogOpen,
  };
}
