import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import {
  createReview,
  deleteMovie,
  getMovieDetails,
  updateMovie,
} from "../services/movieApi";
import type {
  Movie,
  MovieDetail,
  MovieInput,
  ReviewInput,
} from "../types/movie";
import { formatGenres } from "../utils/genres";
import "./MovieModal.css";

type ModalTab = "details" | "cast" | "reviews";

type MovieModalProps = {
  movieId: number;
  posterUrl?: string;
  isAdminMode: boolean;
  onClose: () => void;
  onDeleted: (movieId: number) => void;
  onUpdated: (movie: Movie) => void;
};

const emptyReview: ReviewInput = {
  reviewerName: "",
  rating: 5,
  comment: "",
};

const tabs: ModalTab[] = ["details", "cast", "reviews"];

export function MovieModal({
  movieId,
  posterUrl,
  isAdminMode,
  onClose,
  onDeleted,
  onUpdated,
}: MovieModalProps) {
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState("");
  const [activeTab, setActiveTab] = useState<ModalTab>("details");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<MovieInput | null>(null);
  const [reviewForm, setReviewForm] = useState<ReviewInput>(emptyReview);
  const [actionError, setActionError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const confirmationRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const deleteCancelButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const loadedMovieId = movie?.id;

  useEffect(() => {
    const controller = new AbortController();
    setMovie(null);
    setLoadState("loading");
    setLoadError("");
    setActiveTab("details");
    setIsEditing(false);
    setShowDeleteConfirmation(false);
    setActionError("");

    getMovieDetails(movieId, controller.signal)
      .then((data) => {
        setMovie(data);
        setLoadState("success");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setLoadError(
          error instanceof Error ? error.message : "Could not open this film.",
        );
        setLoadState("error");
      });

    return () => controller.abort();
  }, [movieId]);

  useEffect(() => {
    const activeElement = document.activeElement as HTMLElement | null;
    if (activeElement?.classList.contains("movie-card-trigger")) {
      previousFocusRef.current = activeElement;
    }
  }, [movieId]);

  useEffect(() => {
    if (loadedMovieId === undefined) return;

    const panel = panelRef.current;
    const title = titleRef.current;
    if (!panel || !title) return;

    const siteHeader = document.querySelector<HTMLElement>(".site-header");
    panel.style.setProperty(
      "--movie-panel-scroll-offset",
      `${siteHeader?.getBoundingClientRect().height ?? 0}px`,
    );

    const titleRect = title.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const viewportHeight = document.documentElement.clientHeight;
    const visibleTop = Math.max(0, panelRect.top);
    const visibleBottom = Math.min(viewportHeight, panelRect.bottom);
    const isTitleVisible =
      titleRect.top >= visibleTop && titleRect.bottom <= visibleBottom;

    if (!isTitleVisible) {
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      title.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "start",
      });
    }

    title.focus({ preventScroll: true });
  }, [loadedMovieId]);

  useEffect(
    () => () => {
      if (previousFocusRef.current?.isConnected) {
        previousFocusRef.current.focus({ preventScroll: true });
      }
    },
    [],
  );

  useEffect(() => {
    if (showDeleteConfirmation) {
      deleteCancelButtonRef.current?.focus();
    }
  }, [showDeleteConfirmation]);

  useEffect(() => {
    if (!isAdminMode) {
      setIsEditing(false);
      setShowDeleteConfirmation(false);
      setActionError("");
    }
  }, [isAdminMode]);

  const averageRating = useMemo(() => {
    if (!movie?.reviews.length) return null;
    const total = movie.reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / movie.reviews.length).toFixed(1);
  }, [movie?.reviews]);

  const isBusy = isSaving || isDeleting || isSubmittingReview;

  function handlePanelKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();

      if (isDeleting || isSaving || isSubmittingReview) return;
      if (showDeleteConfirmation) {
        setShowDeleteConfirmation(false);
        setActionError("");
      } else if (isEditing) {
        setIsEditing(false);
        setActionError("");
      } else {
        onClose();
      }
      return;
    }

    if (event.key !== "Tab" || !showDeleteConfirmation) return;

    const focusable = Array.from(
      confirmationRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])',
      ) ?? [],
    ).filter((element) => element.offsetParent !== null);

    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const currentIndex = tabs.indexOf(activeTab);
    let nextIndex = currentIndex;

    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    }
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex === currentIndex) return;

    event.preventDefault();
    setActiveTab(tabs[nextIndex]);
    document.getElementById(`movie-tab-${tabs[nextIndex]}`)?.focus();
  }

  function beginEditing() {
    if (!movie) return;
    setEditForm({
      title: movie.title,
      year: movie.year,
      genre: movie.genre,
      duration: movie.duration,
    });
    setActionError("");
    setIsEditing(true);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!movie || !editForm || isSaving) return;

    const validationError = validateMovie(editForm);
    if (validationError) {
      setActionError(validationError);
      return;
    }

    const payload: MovieInput = {
      ...editForm,
      title: editForm.title.trim(),
      genre: editForm.genre.trim(),
    };

    setIsSaving(true);
    setActionError("");

    try {
      await updateMovie(movie.id, payload);
      const updatedMovie: Movie = { id: movie.id, ...payload };
      setMovie((current) => (current ? { ...current, ...payload } : current));
      onUpdated(updatedMovie);
      setIsEditing(false);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not save the changes.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (isDeleting) return;
    setIsDeleting(true);
    setActionError("");

    try {
      await deleteMovie(movieId);
      onDeleted(movieId);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not delete the film.",
      );
      setIsDeleting(false);
    }
  }

  async function handleReviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!movie || isSubmittingReview) return;

    const validationError = validateReview(reviewForm);
    if (validationError) {
      setActionError(validationError);
      return;
    }

    const payload: ReviewInput = {
      reviewerName: reviewForm.reviewerName.trim(),
      rating: reviewForm.rating,
      comment: reviewForm.comment.trim(),
    };

    setIsSubmittingReview(true);
    setActionError("");

    try {
      const created = await createReview(movie.id, payload);
      setMovie((current) =>
        current ? { ...current, reviews: [...current.reviews, created] } : current,
      );
      setReviewForm(emptyReview);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Could not submit the review.",
      );
    } finally {
      setIsSubmittingReview(false);
    }
  }

  return (
      <aside
        id="movie-details-panel"
        ref={panelRef}
        className="movie-details-panel"
        aria-labelledby={movie ? "movie-modal-title" : undefined}
        aria-label={!movie ? "Movie details" : undefined}
        onKeyDown={handlePanelKeyDown}
      >
        <button
          ref={closeButtonRef}
          className="movie-modal-close"
          type="button"
          aria-label="Close movie details"
          onClick={onClose}
          disabled={isBusy}
        >
          ×
        </button>

        {loadState === "loading" && (
          <div className="movie-modal-status" role="status">
            Loading film details…
          </div>
        )}

        {loadState === "error" && (
          <div className="movie-modal-status" role="alert">
            <strong>The film details could not be opened.</strong>
            <span>{loadError}</span>
          </div>
        )}

        {movie && isAdminMode && showDeleteConfirmation && (
          <section
            ref={confirmationRef}
            className="delete-confirmation"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-confirmation-title"
          >
            <p className="modal-kicker">Delete film</p>
            <h2 id="delete-confirmation-title">Delete “{movie.title}”?</h2>
            <p>
              This permanently deletes the film from the archive. This action
              cannot be undone.
            </p>
            {actionError && <p className="modal-form-error">{actionError}</p>}
            <div className="confirmation-actions">
              <button
                ref={deleteCancelButtonRef}
                className="modal-button modal-button-secondary"
                type="button"
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  setActionError("");
                }}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className="modal-button modal-button-danger"
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting…" : "Delete film"}
              </button>
            </div>
          </section>
        )}

        {movie && (!showDeleteConfirmation || !isAdminMode) && (
          <div className="movie-modal-layout">
            <div className="movie-modal-poster">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={`Poster for ${movie.title}`}
                  width={800}
                  height={1200}
                />
              ) : (
                <span aria-hidden="true">{movie.title.charAt(0)}</span>
              )}
            </div>

            <div className="movie-modal-content">
              <header className="movie-modal-heading">
                <p className="modal-kicker">CinematheQue archive</p>
                <h2 id="movie-modal-title" ref={titleRef} tabIndex={-1}>
                  {movie.title}
                </h2>
                <p className="movie-modal-meta">
                  <span>{movie.year}</span>
                  <span>{formatGenres(movie.genre)}</span>
                  <span>{movie.duration} min</span>
                </p>
              </header>

              {isAdminMode && isEditing && editForm ? (
                <form className="movie-edit-form" onSubmit={handleSave}>
                  <div className="modal-field modal-field-wide">
                    <label htmlFor="edit-title">Title</label>
                    <input
                      id="edit-title"
                      value={editForm.title}
                      onChange={(event) =>
                        setEditForm({ ...editForm, title: event.target.value })
                      }
                      required
                      minLength={2}
                      maxLength={120}
                    />
                  </div>
                  <div className="modal-field">
                    <label htmlFor="edit-year">Year</label>
                    <input
                      id="edit-year"
                      type="number"
                      value={editForm.year}
                      onChange={(event) =>
                        setEditForm({ ...editForm, year: Number(event.target.value) })
                      }
                      min={1888}
                      max={2100}
                      required
                    />
                  </div>
                  <div className="modal-field">
                    <label htmlFor="edit-duration">Duration (minutes)</label>
                    <input
                      id="edit-duration"
                      type="number"
                      value={editForm.duration}
                      onChange={(event) =>
                        setEditForm({
                          ...editForm,
                          duration: Number(event.target.value),
                        })
                      }
                      min={1}
                      max={600}
                      required
                    />
                  </div>
                  <div className="modal-field modal-field-wide">
                    <label htmlFor="edit-genre">Genre</label>
                    <input
                      id="edit-genre"
                      value={editForm.genre}
                      onChange={(event) =>
                        setEditForm({ ...editForm, genre: event.target.value })
                      }
                      required
                    />
                  </div>
                  {actionError && <p className="modal-form-error">{actionError}</p>}
                  <div className="movie-modal-actions modal-field-wide">
                    <button
                      className="modal-button modal-button-secondary"
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setActionError("");
                      }}
                      disabled={isSaving}
                    >
                      Cancel
                    </button>
                    <button
                      className="modal-button modal-button-primary"
                      type="submit"
                      disabled={isSaving}
                    >
                      {isSaving ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="movie-modal-tabs" role="tablist" aria-label="Movie information">
                    {tabs.map((tab) => (
                      <button
                        id={`movie-tab-${tab}`}
                        key={tab}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab}
                        aria-controls={`movie-panel-${tab}`}
                        tabIndex={activeTab === tab ? 0 : -1}
                        onClick={() => {
                          setActiveTab(tab);
                          setActionError("");
                        }}
                        onKeyDown={handleTabKeyDown}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>

                  <div
                    id={`movie-panel-${activeTab}`}
                    className="movie-modal-panel"
                    role="tabpanel"
                    aria-labelledby={`movie-tab-${activeTab}`}
                    tabIndex={0}
                  >
                    {activeTab === "details" && (
                      <div className="details-panel">
                        <p className="movie-synopsis">
                          {movie.details?.synopsis || "No synopsis is available."}
                        </p>
                        <dl className="movie-facts">
                          <div>
                            <dt>Language</dt>
                            <dd>{movie.details?.language || "Unknown"}</dd>
                          </div>
                          <div>
                            <dt>Budget</dt>
                            <dd>{formatBudget(movie.details?.budget)}</dd>
                          </div>
                        </dl>
                      </div>
                    )}

                    {activeTab === "cast" && (
                      <div className="cast-panel">
                        {movie.actors.length === 0 ? (
                          <p className="modal-empty-state">No cast is listed for this film.</p>
                        ) : (
                          <ul className="cast-list">
                            {movie.actors.map((actor) => (
                              <li key={`${actor.id}-${actor.role}`}>
                                <strong>{actor.name}</strong>
                                <span>{actor.role}</span>
                                <small>
                                  Born {actor.birthYear === 0 ? "Unknown" : actor.birthYear}
                                </small>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}

                    {activeTab === "reviews" && (
                      <div className="reviews-panel">
                        <div className="review-summary">
                          <span>Reviews</span>
                          <strong>
                            {averageRating ? `${averageRating} / 5` : "No rating yet"}
                          </strong>
                          <small>{movie.reviews.length} total</small>
                        </div>

                        {movie.reviews.length === 0 ? (
                          <p className="modal-empty-state">No reviews yet. Be the first to leave one.</p>
                        ) : (
                          <ul className="review-list">
                            {movie.reviews.map((review) => (
                              <li key={review.id}>
                                <div>
                                  <strong>{review.reviewerName}</strong>
                                  <span aria-label={`${review.rating} out of 5 stars`}>
                                    {"★".repeat(review.rating)}
                                  </span>
                                </div>
                                <p>{review.comment}</p>
                              </li>
                            ))}
                          </ul>
                        )}

                        <form className="review-form" onSubmit={handleReviewSubmit}>
                          <h3>Leave a review</h3>
                          <div className="modal-field">
                            <label htmlFor="reviewer-name">Reviewer</label>
                            <input
                              id="reviewer-name"
                              value={reviewForm.reviewerName}
                              onChange={(event) =>
                                setReviewForm({
                                  ...reviewForm,
                                  reviewerName: event.target.value,
                                })
                              }
                              minLength={2}
                              maxLength={100}
                              required
                            />
                          </div>
                          <div className="modal-field">
                            <label htmlFor="review-rating">Rating</label>
                            <select
                              id="review-rating"
                              value={reviewForm.rating}
                              onChange={(event) =>
                                setReviewForm({
                                  ...reviewForm,
                                  rating: Number(event.target.value),
                                })
                              }
                            >
                              {[5, 4, 3, 2, 1].map((rating) => (
                                <option key={rating} value={rating}>
                                  {rating} / 5
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="modal-field modal-field-wide">
                            <label htmlFor="review-comment">Comment</label>
                            <textarea
                              id="review-comment"
                              value={reviewForm.comment}
                              onChange={(event) =>
                                setReviewForm({
                                  ...reviewForm,
                                  comment: event.target.value,
                                })
                              }
                              minLength={10}
                              maxLength={200}
                              rows={4}
                              required
                            />
                          </div>
                          {actionError && <p className="modal-form-error">{actionError}</p>}
                          <button
                            className="modal-button modal-button-primary modal-field-wide"
                            type="submit"
                            disabled={isSubmittingReview}
                          >
                            {isSubmittingReview ? "Submitting…" : "Submit review"}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>

                  {isAdminMode && (
                    <div className="movie-modal-actions">
                      <button
                        className="modal-button modal-button-secondary"
                        type="button"
                        onClick={beginEditing}
                      >
                        Edit
                      </button>
                      <button
                        className="modal-button modal-button-danger"
                        type="button"
                        onClick={() => {
                          setActionError("");
                          setShowDeleteConfirmation(true);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </aside>
  );
}

function validateMovie(movie: MovieInput): string | null {
  const title = movie.title.trim();
  if (title.length < 2 || title.length > 120) {
    return "Title must be between 2 and 120 characters.";
  }
  if (movie.year < 1888 || movie.year > 2100) {
    return "Year must be between 1888 and 2100.";
  }
  if (!movie.genre.trim()) return "Genre is required.";
  if (movie.duration < 1 || movie.duration > 600) {
    return "Duration must be between 1 and 600 minutes.";
  }
  return null;
}

function validateReview(review: ReviewInput): string | null {
  const reviewerName = review.reviewerName.trim();
  const comment = review.comment.trim();
  if (reviewerName.length < 2 || reviewerName.length > 100) {
    return "Reviewer name must be between 2 and 100 characters.";
  }
  if (!Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5) {
    return "Rating must be between 1 and 5.";
  }
  if (comment.length < 10 || comment.length > 200) {
    return "Comment must be between 10 and 200 characters.";
  }
  return null;
}

function formatBudget(budget?: number): string {
  if (!budget) return "Not disclosed";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(budget);
}
