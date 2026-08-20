import type { RefObject } from "react";
import type { HeroRevealState } from "../../hooks/useCinematicIntro";

type CatalogHeroProps = {
  headingRef: RefObject<HTMLHeadingElement | null>;
  revealState: HeroRevealState;
};

export function CatalogHero({ headingRef, revealState }: CatalogHeroProps) {
  return (
    <section className={`hero hero-reveal-${revealState}`}>
      <div className="hero-copy">
        <h1 ref={headingRef} tabIndex={-1}>
          <span className="hero-title-line hero-title-the">The</span>
          <span className="hero-title-line hero-title-selective">selective</span>
          <span className="hero-title-line hero-title-archive">archive</span>
        </h1>
        <p className="intro">Stories worth keeping.</p>
      </div>
    </section>
  );
}
