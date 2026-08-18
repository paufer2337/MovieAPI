import { useEffect, useRef, useState } from "react";
import { MovieCreateDialog } from "./components/MovieCreateForm";
import { MovieModal } from "./components/MovieModal";
import { getMoviePoster } from "./data/moviePosters";
import { getMovies } from "./services/movieApi";
import type { Movie } from "./types/movie";
import "./App.css";

type LoadState = "loading" | "success" | "error";

function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creationMessage, setCreationMessage] = useState("");
  const [loadState, setLoadState] =
    useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const addFilmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const controller = new AbortController();

    setLoadState("loading");
    setErrorMessage("");

    getMovies({
      signal: controller.signal,
      genre: selectedGenre || undefined,
    })
      .then((data) => {
        setMovies(data);

        if (!selectedGenre) {
          const availableGenres = [
            ...new Set(
              data.flatMap((movie) =>
                movie.genre
                  .split("/")
                  .map((genre) => genre.trim())
                  .filter(Boolean),
              ),
            ),
          ].sort((first, second) =>
            first.localeCompare(second),
          );

          setGenres(availableGenres);
        }

        setLoadState("success");
      })
      .catch((error: unknown) => {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
        );

        setLoadState("error");
      });

    return () => controller.abort();
  }, [selectedGenre]);

  const selectedMovie = movies.find(
    (movie) => movie.id === selectedMovieId,
  );

  function closeCreateDialog() {
    setIsCreateDialogOpen(false);
    requestAnimationFrame(() => addFilmButtonRef.current?.focus());
  }

  function handleMovieCreated(createdMovie: Movie) {
    setMovies((current) => [
      createdMovie,
      ...current.filter((movie) => movie.id !== createdMovie.id),
    ]);
    setGenres((current) => {
      const createdGenres = createdMovie.genre
        .split("/")
        .map((genre) => genre.trim())
        .filter(Boolean);

      return [...new Set([...current, ...createdGenres])].sort(
        (first, second) => first.localeCompare(second),
      );
    });

    if (
      selectedGenre &&
      !createdMovie.genre
        .toLocaleLowerCase()
        .includes(selectedGenre.toLocaleLowerCase())
    ) {
      setSelectedGenre("");
    }

    setCreationMessage(`“${createdMovie.title}” was added to the archive.`);
    closeCreateDialog();
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a
          className="brand"
          href="/"
          aria-label="CinematheQue home"
        >
          <img
            className="brand-lockup"
            src="/branding/cinematheque-header-lockup.webp"
            alt=""
            width={1200}
            height={244}
          />
        </a>

        <button
          className="admin-mode-toggle"
          type="button"
          aria-pressed={isAdminMode}
          onClick={() => {
            setIsAdminMode((current) => !current);
            setCreationMessage("");
          }}
        >
          {isAdminMode ? "EXIT ADMIN MODE" : "ADMIN MODE"}
        </button>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <h1>
              The infinite
              <br />
              archive
            </h1>

            <p className="intro">
              Stories worth keeping.
            </p>
          </div>
        </section>

        <section
          id="catalog"
          className="catalog"
          aria-labelledby="catalog-title"
        >
          <div
            className={`catalog-layout${
              selectedMovieId !== null ? " has-details" : ""
            }`}
          >
          <div className="section-heading">
            <div>
              <h2 id="catalog-title">
                All films
              </h2>
            </div>

            <div className="catalog-controls">
              {isAdminMode ? (
                <button
                  ref={addFilmButtonRef}
                  className="add-film-button"
                  type="button"
                  aria-haspopup="dialog"
                  onClick={() => {
                    setCreationMessage("");
                    setIsCreateDialogOpen(true);
                  }}
                >
                  + ADD FILM
                </button>
              ) : (
                <span className="add-film-placeholder" aria-hidden="true" />
              )}

              <label
                className="genre-filter"
                htmlFor="genre-filter"
              >
                <span>Filter by genre</span>

                <select
                  id="genre-filter"
                  value={selectedGenre}
                  onChange={(event) =>
                    setSelectedGenre(
                      event.target.value,
                    )
                  }
                >
                  <option value="">
                    All genres
                  </option>

                  {genres.map((genre) => (
                    <option
                      key={genre}
                      value={genre}
                    >
                      {genre}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="catalog-results">
          {loadState === "loading" && (
            <div
              className="movie-grid"
              aria-label="Loading movies"
            >
              {Array.from(
                { length: 6 },
                (_, index) => (
                  <div
                    className="movie-card skeleton"
                    key={index}
                  />
                ),
              )}
            </div>
          )}

          {loadState === "error" && (
            <div
              className="message error"
              role="alert"
            >
              <strong>
                The archive could not be opened.
              </strong>

              <span>{errorMessage}</span>
            </div>
          )}

          {loadState === "success" &&
            movies.length === 0 && (
              <div className="message">
                <strong>
                  {selectedGenre
                    ? "No films found."
                    : "The archive is empty."}
                </strong>

                <span>
                  {selectedGenre
                    ? "Try selecting another genre."
                    : "Add the first movie to begin the collection."}
                </span>
              </div>
            )}

          {loadState === "success" &&
            movies.length > 0 && (
              <div className="movie-grid">
                {movies.map((movie) => {
                  const posterUrl =
                    getMoviePoster(movie.title);

                  return (
                    <article className="movie-card" key={movie.id}>
                      <button
                        className="movie-card-trigger"
                        type="button"
                        aria-label={`View details for ${movie.title}`}
                        aria-expanded={selectedMovieId === movie.id}
                        aria-controls={
                          selectedMovieId === movie.id
                            ? "movie-details-panel"
                            : undefined
                        }
                        onClick={() => setSelectedMovieId(movie.id)}
                      >
                        <div
                          className={`poster poster-${movie.id % 4}`}
                        >
                          {posterUrl ? (
                            <img
                              className="poster-image"
                              src={posterUrl}
                              alt=""
                              width={800}
                              height={1200}
                              loading="lazy"
                            />
                          ) : (
                            <span className="poster-letter">
                              {movie.title.charAt(0)}
                            </span>
                          )}

                        </div>

                        <div className="movie-content">
                          <p>{movie.genre}</p>
                          <h3>{movie.title}</h3>

                          <div className="movie-card-meta">
                            <span>{movie.year}</span>
                            <span>{movie.duration} min</span>
                          </div>
                        </div>
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          {selectedMovieId !== null && (
            <MovieModal
              movieId={selectedMovieId}
              posterUrl={
                selectedMovie
                  ? getMoviePoster(selectedMovie.title)
                  : undefined
              }
              onClose={() => setSelectedMovieId(null)}
              onDeleted={(movieId) => {
                setMovies((current) =>
                  current.filter((movie) => movie.id !== movieId),
                );
                setSelectedMovieId(null);
              }}
              onUpdated={(updatedMovie) => {
                setMovies((current) =>
                  current.map((movie) =>
                    movie.id === updatedMovie.id ? updatedMovie : movie,
                  ),
                );
              }}
              isAdminMode={isAdminMode}
            />
          )}
          </div>
        </section>
      </main>

      <p
        className="creation-status"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {creationMessage}
      </p>

      {isCreateDialogOpen && (
        <MovieCreateDialog
          onCancel={closeCreateDialog}
          onCreated={handleMovieCreated}
        />
      )}
    </div>
  );
}

export default App;
