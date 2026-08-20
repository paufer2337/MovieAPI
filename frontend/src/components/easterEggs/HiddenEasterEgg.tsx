import { useRef, useState, type MouseEvent } from "react";
import { getEasterEggForMovie } from "../../data/easterEggs";
import type { EasterEggConfig } from "../../types/easterEgg";
import { EasterEggVideoDialog } from "./EasterEggVideoDialog";
import "./EasterEggs.css";

export function MovieEasterEgg({ movieTitle }: { movieTitle: string }) {
  const egg = getEasterEggForMovie(movieTitle);
  return egg ? <HiddenEasterEgg egg={egg} /> : null;
}

export function HiddenEasterEgg({ egg }: { egg: EasterEggConfig }) {
  const [clickCount, setClickCount] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    const nextCount = clickCount + 1;

    if (nextCount === 3) {
      setClickCount(0);
      setIsRevealed(true);
      return;
    }

    setClickCount(nextCount);
  }

  function handleClose() {
    setIsRevealed(false);
    requestAnimationFrame(() => buttonRef.current?.focus({ preventScroll: true }));
  }

  return (
    <>
      <button
        ref={buttonRef}
        className={`hidden-easter-egg hidden-easter-egg--${egg.position}`}
        type="button"
        aria-label={egg.accessibleName}
        onClick={handleClick}
      >
        <img src={egg.assetPath} alt="" draggable="false" />
      </button>

      {isRevealed && (
        <EasterEggVideoDialog egg={egg} onClose={handleClose} />
      )}
    </>
  );
}
