import { useEffect, useRef, type MouseEvent } from "react";
import type { EasterEggConfig } from "../../types/easterEgg";
import { buildYouTubeEmbedUrl } from "../../utils/youtubeEmbed";

type EasterEggVideoDialogProps = {
  egg: EasterEggConfig;
  onClose: () => void;
};

export function EasterEggVideoDialog({
  egg,
  onClose,
}: EasterEggVideoDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const embedUrl = buildYouTubeEmbedUrl(egg.videoId);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.showModal();
    closeButtonRef.current?.focus({ preventScroll: true });

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function handleBackdropClick(event: MouseEvent<HTMLDialogElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      className="easter-egg-dialog"
      aria-label={`Easter egg video for ${egg.movieTitle}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={handleBackdropClick}
    >
      <div className="easter-egg-dialog-content">
        <button
          ref={closeButtonRef}
          className="easter-egg-dialog-close"
          type="button"
          aria-label="Close Easter egg video"
          onClick={onClose}
        >
          ×
        </button>

        <div
          className={`easter-egg-video easter-egg-video--${egg.format}`}
        >
          <iframe
            src={embedUrl}
            title={`Easter egg video for ${egg.movieTitle}`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>

        <a
          className="easter-egg-youtube-link"
          href={egg.originalUrl}
          target="_blank"
          rel="noreferrer"
        >
          Watch on YouTube
        </a>
      </div>
    </dialog>
  );
}
