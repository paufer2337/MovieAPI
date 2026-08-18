import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type SyntheticEvent,
} from "react";
import { createMovie } from "../services/movieApi";
import type { Movie, MovieInput } from "../types/movie";
import "./MovieCreateForm.css";

type MovieCreateFormProps = {
  onCreated: (movie: Movie) => void;
  onCancel?: () => void;
  onSubmittingChange?: (isSubmitting: boolean) => void;
};

type MovieCreateDialogProps = {
  onCreated: (movie: Movie) => void;
  onCancel: () => void;
};

type FormValues = {
  title: string;
  year: string;
  genre: string;
  duration: string;
};

type FieldName = keyof FormValues;
type FieldErrors = Partial<Record<FieldName, string>>;

const emptyForm: FormValues = {
  title: "",
  year: "",
  genre: "",
  duration: "",
};

export function MovieCreateDialog({
  onCreated,
  onCancel,
}: MovieCreateDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    dialog.showModal();
    dialog.querySelector<HTMLInputElement>("input")?.focus();

    return () => {
      if (dialog.open) dialog.close();
    };
  }, []);

  function handleKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;

    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]',
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

  function requestClose() {
    if (!isSubmitting) onCancel();
  }

  return (
    <dialog
      ref={dialogRef}
      className="movie-create-dialog"
      aria-labelledby="movie-create-dialog-title"
      onCancel={(event: SyntheticEvent<HTMLDialogElement>) => {
        event.preventDefault();
        requestClose();
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="movie-create-dialog-header">
        <div>
          <p>CinematheQue administration</p>
          <h2 id="movie-create-dialog-title">Add a film</h2>
        </div>

        <button
          className="movie-create-dialog-close"
          type="button"
          aria-label="Close add film dialog"
          disabled={isSubmitting}
          onClick={requestClose}
        >
          ×
        </button>
      </div>

      <MovieCreateForm
        onCreated={onCreated}
        onCancel={requestClose}
        onSubmittingChange={setIsSubmitting}
      />
    </dialog>
  );
}

export function MovieCreateForm({
  onCreated,
  onCancel,
  onSubmittingChange,
}: MovieCreateFormProps) {
  const [form, setForm] = useState<FormValues>(emptyForm);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: FieldName, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setApiError("");

    const errors = validateForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload: MovieInput = {
      title: form.title.trim(),
      year: Number(form.year),
      genre: form.genre.trim(),
      duration: Number(form.duration),
    };

    setIsSubmitting(true);
    onSubmittingChange?.(true);

    try {
      const createdMovie = await createMovie(payload);
      setForm(emptyForm);
      setFieldErrors({});
      onCreated(createdMovie);
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "The movie could not be added. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
      onSubmittingChange?.(false);
    }
  }

  return (
    <form className="movie-create-form" noValidate onSubmit={handleSubmit}>
      <fieldset disabled={isSubmitting}>
        <legend>Film information</legend>

        <div className="movie-create-fields">
          <div className="movie-create-field movie-create-field-title">
            <label htmlFor="create-movie-title">Title</label>
            <input
              id="create-movie-title"
              name="title"
              type="text"
              value={form.title}
              minLength={2}
              maxLength={120}
              autoComplete="off"
              required
              aria-invalid={Boolean(fieldErrors.title)}
              aria-describedby={
                fieldErrors.title ? "create-movie-title-error" : undefined
              }
              onChange={(event) => updateField("title", event.target.value)}
            />
            {fieldErrors.title && (
              <span id="create-movie-title-error" className="movie-create-error">
                {fieldErrors.title}
              </span>
            )}
          </div>

          <div className="movie-create-field">
            <label htmlFor="create-movie-year">Year</label>
            <input
              id="create-movie-year"
              name="year"
              type="number"
              value={form.year}
              min={1888}
              max={2100}
              step={1}
              inputMode="numeric"
              required
              aria-invalid={Boolean(fieldErrors.year)}
              aria-describedby={
                fieldErrors.year ? "create-movie-year-error" : undefined
              }
              onChange={(event) => updateField("year", event.target.value)}
            />
            {fieldErrors.year && (
              <span id="create-movie-year-error" className="movie-create-error">
                {fieldErrors.year}
              </span>
            )}
          </div>

          <div className="movie-create-field">
            <label htmlFor="create-movie-genre">Genre</label>
            <input
              id="create-movie-genre"
              name="genre"
              type="text"
              value={form.genre}
              autoComplete="off"
              required
              aria-invalid={Boolean(fieldErrors.genre)}
              aria-describedby={
                fieldErrors.genre ? "create-movie-genre-error" : undefined
              }
              onChange={(event) => updateField("genre", event.target.value)}
            />
            {fieldErrors.genre && (
              <span id="create-movie-genre-error" className="movie-create-error">
                {fieldErrors.genre}
              </span>
            )}
          </div>

          <div className="movie-create-field">
            <label htmlFor="create-movie-duration">Duration (minutes)</label>
            <input
              id="create-movie-duration"
              name="duration"
              type="number"
              value={form.duration}
              min={1}
              max={600}
              step={1}
              inputMode="numeric"
              required
              aria-invalid={Boolean(fieldErrors.duration)}
              aria-describedby={
                fieldErrors.duration
                  ? "create-movie-duration-error"
                  : undefined
              }
              onChange={(event) => updateField("duration", event.target.value)}
            />
            {fieldErrors.duration && (
              <span
                id="create-movie-duration-error"
                className="movie-create-error"
              >
                {fieldErrors.duration}
              </span>
            )}
          </div>

          <div className="movie-create-actions">
            {onCancel && (
              <button
                className="movie-create-cancel"
                type="button"
                onClick={onCancel}
              >
                Cancel
              </button>
            )}

            <button className="movie-create-submit" type="submit">
              {isSubmitting ? "Saving film…" : "Add film"}
            </button>
          </div>
        </div>
      </fieldset>

      {apiError && (
        <p className="movie-create-message movie-create-message-error" role="alert">
          {apiError}
        </p>
      )}

    </form>
  );
}

function validateForm(form: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  const title = form.title.trim();
  const genre = form.genre.trim();
  const year = Number(form.year);
  const duration = Number(form.duration);

  if (title.length < 2 || title.length > 120) {
    errors.title = "Title must be between 2 and 120 characters.";
  }

  if (!form.year || !Number.isInteger(year) || year < 1888 || year > 2100) {
    errors.year = "Year must be a whole number between 1888 and 2100.";
  }

  if (!genre) {
    errors.genre = "Genre is required.";
  }

  if (
    !form.duration ||
    !Number.isInteger(duration) ||
    duration < 1 ||
    duration > 600
  ) {
    errors.duration = "Duration must be a whole number between 1 and 600 minutes.";
  }

  return errors;
}
