import type { CSSProperties, RefObject } from "react";
import type { IntroPhase } from "../../hooks/useCinematicIntro";

type CinematicIntroProps = {
  flightTransform: { x: number; y: number; scale: number };
  introLogoRef: RefObject<HTMLImageElement | null>;
  introPhase: IntroPhase;
  onFinish: (shouldAnimateHero: boolean) => void;
  onLogoAnimationEnd: () => void;
  onWordmarkAnimationEnd: () => void;
};

export function CinematicIntro({
  flightTransform,
  introLogoRef,
  introPhase,
  onFinish,
  onLogoAnimationEnd,
  onWordmarkAnimationEnd,
}: CinematicIntroProps) {
  return (
    <div className="cinematic-intro" data-testid="cinematic-intro">
      <div className="cinematic-intro-visual" aria-hidden="true">
        <img
          ref={introLogoRef}
          className={`cinematic-intro-logo intro-phase-${introPhase}`}
          data-testid="intro-logo"
          src="/images/intro-logo.png"
          alt=""
          aria-hidden="true"
          width={1336}
          height={750}
          style={{
            "--intro-flight-x": `${flightTransform.x}px`,
            "--intro-flight-y": `${flightTransform.y}px`,
            "--intro-flight-scale": flightTransform.scale,
          } as CSSProperties}
          onAnimationEnd={onLogoAnimationEnd}
        />
        {(introPhase === "name" || introPhase === "name-out") && (
          <img
            className={`cinematic-intro-name intro-phase-${introPhase}`}
            data-testid="intro-name"
            src="/images/cinematheque-wordmark.png"
            alt=""
            aria-hidden="true"
            width={1013}
            height={152}
            onAnimationEnd={onWordmarkAnimationEnd}
          />
        )}
      </div>
      <button
        className="cinematic-intro-skip"
        type="button"
        onClick={() => onFinish(false)}
      >
        Skip intro
      </button>
    </div>
  );
}
