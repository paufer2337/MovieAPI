import { Link, NavLink } from "react-router-dom";
import type { RefObject } from "react";

type SiteHeaderProps = {
  authButtonRef: RefObject<HTMLButtonElement | null>;
  headerLogoRef: RefObject<HTMLImageElement | null>;
  hideLogo: boolean;
  isAdminMode: boolean;
  onAuthAction: () => void;
};

export function SiteHeader({
  authButtonRef,
  headerLogoRef,
  hideLogo,
  isAdminMode,
  onAuthAction,
}: SiteHeaderProps) {
  return (
    <header className="site-header">
      <Link
        className={`brand${hideLogo ? " brand-intro-target-hidden" : ""}`}
        to="/"
        aria-label="CinematheQue home"
      >
        <img
          ref={headerLogoRef}
          className="brand-lockup"
          src="/branding/cinematheque-header-lockup.webp"
          alt=""
          width={1200}
          height={244}
        />
      </Link>

      <div className="header-admin-actions">
        {isAdminMode && (
          <NavLink
            className={({ isActive }) =>
              `admin-mode-toggle${isActive ? " admin-session-active" : ""}`
            }
            to="/dashboard"
          >
            DASHBOARD
          </NavLink>
        )}
        <button
          ref={authButtonRef}
          className={`admin-mode-toggle${isAdminMode ? " admin-session-active" : ""}`}
          type="button"
          aria-haspopup={isAdminMode ? undefined : "dialog"}
          onClick={onAuthAction}
        >
          {isAdminMode ? "LOGOUT" : "ADMIN LOGIN"}
        </button>
      </div>
    </header>
  );
}
