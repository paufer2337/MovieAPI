import { Route, Routes, useLocation } from "react-router-dom";
import { AdminLoginDialog } from "./components/AdminLoginDialog";
import { DashboardPage } from "./components/DashboardPage";
import { CinematicIntro } from "./components/intro/CinematicIntro";
import { SiteHeader } from "./components/layout/SiteHeader";
import { useAuthSession } from "./hooks/useAuthSession";
import { useCinematicIntro } from "./hooks/useCinematicIntro";
import { CatalogPage } from "./pages/CatalogPage";
import { MovieDetailsRoute } from "./pages/MovieDetailsRoute";
import { NotFoundPage } from "./pages/NotFoundPage";
import "./App.css";

export { INTRO_SESSION_STORAGE_KEY } from "./hooks/useCinematicIntro";

function App() {
  const location = useLocation();
  const auth = useAuthSession();
  const intro = useCinematicIntro(location.pathname);

  return (
    <div className="app-shell">
      <SiteHeader
        authButtonRef={auth.authButtonRef}
        headerLogoRef={intro.headerLogoRef}
        hideLogo={intro.introActive}
        isAdminMode={auth.isAdminMode}
        onAuthAction={auth.handleAuthAction}
      />

      {auth.authMessage && (
        <p className="auth-status" role="status" aria-live="polite">
          {auth.authMessage}
        </p>
      )}

      {auth.isLoginDialogOpen && (
        <AdminLoginDialog
          onAuthenticated={auth.handleAuthenticated}
          onCancel={auth.handleLoginCancel}
        />
      )}

      {intro.introActive && location.pathname === "/" && intro.introPhase && (
        <CinematicIntro
          flightTransform={intro.flightTransform}
          introLogoRef={intro.introLogoRef}
          introPhase={intro.introPhase}
          onFinish={intro.finishIntro}
          onLogoAnimationEnd={intro.handleLogoAnimationEnd}
          onWordmarkAnimationEnd={intro.handleWordmarkAnimationEnd}
        />
      )}

      <Routes>
        <Route
          path="/"
          element={(
            <CatalogPage
              heroRevealState={intro.heroRevealState}
              isAdminMode={auth.isAdminMode}
            />
          )}
        />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route
          path="/movies/:id"
          element={<MovieDetailsRoute isAdminMode={auth.isAdminMode} />}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

export default App;
