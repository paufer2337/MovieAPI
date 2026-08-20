import { useEffect, useRef, useState } from "react";

export type HeroRevealState = "waiting" | "animated" | "complete";
export type IntroPhase = "logo" | "name" | "name-out" | "flight" | "settle";

export const INTRO_SESSION_STORAGE_KEY = "cinematheque:intro-complete";

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function shouldStartIntro(pathname: string) {
  return pathname === "/" &&
    sessionStorage.getItem(INTRO_SESSION_STORAGE_KEY) !== "true" &&
    !prefersReducedMotion();
}

export function useCinematicIntro(pathname: string) {
  const [introPhase, setIntroPhase] = useState<IntroPhase | null>(() =>
    shouldStartIntro(pathname) ? "logo" : null,
  );
  const [animateHero, setAnimateHero] = useState(false);
  const [flightTransform, setFlightTransform] = useState({ x: 0, y: 0, scale: 1 });
  const headerLogoRef = useRef<HTMLImageElement>(null);
  const introLogoRef = useRef<HTMLImageElement>(null);
  const introActive = introPhase !== null;

  useEffect(() => {
    if (pathname !== "/") {
      setIntroPhase((currentPhase) => {
        if (currentPhase) {
          sessionStorage.setItem(INTRO_SESSION_STORAGE_KEY, "true");
        }
        return null;
      });
      return;
    }

    if (sessionStorage.getItem(INTRO_SESSION_STORAGE_KEY) === "true") return;

    if (prefersReducedMotion()) {
      sessionStorage.setItem(INTRO_SESSION_STORAGE_KEY, "true");
      setAnimateHero(false);
      return;
    }

    setAnimateHero(false);
    setIntroPhase((currentPhase) => currentPhase ?? "logo");
  }, [pathname]);

  useEffect(() => {
    if (!introActive) return;

    const fallbackId = window.setTimeout(() => {
      sessionStorage.setItem(INTRO_SESSION_STORAGE_KEY, "true");
      setAnimateHero(true);
      setIntroPhase(null);
    }, 9_000);

    return () => window.clearTimeout(fallbackId);
  }, [introActive]);

  function finishIntro(shouldAnimateHero: boolean) {
    sessionStorage.setItem(INTRO_SESSION_STORAGE_KEY, "true");
    setAnimateHero(shouldAnimateHero);
    setIntroPhase(null);
  }

  function startLogoFlight() {
    const sourceBounds = introLogoRef.current?.getBoundingClientRect();
    const targetBounds = headerLogoRef.current?.getBoundingClientRect();

    if (!sourceBounds || !targetBounds) {
      finishIntro(true);
      return;
    }

    setFlightTransform({
      x: targetBounds.left + targetBounds.width / 2 -
        (sourceBounds.left + sourceBounds.width / 2),
      y: targetBounds.top + targetBounds.height / 2 -
        (sourceBounds.top + sourceBounds.height / 2),
      scale: sourceBounds.width > 0 ? targetBounds.width / sourceBounds.width : 1,
    });
    setIntroPhase("flight");
  }

  function handleLogoAnimationEnd() {
    if (introPhase === "logo") setIntroPhase("name");
    else if (introPhase === "flight") setIntroPhase("settle");
    else if (introPhase === "settle") finishIntro(true);
  }

  function handleWordmarkAnimationEnd() {
    if (introPhase === "name") setIntroPhase("name-out");
    else if (introPhase === "name-out") startLogoFlight();
  }

  const heroRevealState: HeroRevealState = introActive
    ? "waiting"
    : animateHero
      ? "animated"
      : "complete";

  return {
    finishIntro,
    flightTransform,
    handleLogoAnimationEnd,
    handleWordmarkAnimationEnd,
    headerLogoRef,
    heroRevealState,
    introActive,
    introLogoRef,
    introPhase,
  };
}
