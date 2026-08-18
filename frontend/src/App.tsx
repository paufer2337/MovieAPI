import { useEffect, useRef, useState, type RefObject } from "react";
import { Link, Route, Routes, useParams } from "react-router-dom";
import { MovieCreateDialog } from "./components/MovieCreateForm";
import { MovieDetailsPage } from "./components/MovieModal";
import { getMoviePoster } from "./data/moviePosters";
import { getMovies } from "./services/movieApi";
import type { Movie } from "./types/movie";
import { getPrimaryGenre, parseGenres } from "./utils/genres";
import "./App.css";

type LoadState = "loading" | "success" | "error";

function App() {
  const [isAdminMode, setIsAdminMode] = useState(false);

  return (
    <div className="app-shell">
      <header className="site-header">
        <Link className="brand" to="/" aria-label="CinematheQue home">
          <img
            className="brand-lockup"
            src="/branding/cinematheque-header-lockup.webp"
            alt=""
            width={1200}
            height={244}
          />
        </Link>

        <button
          className="admin-mode-toggle"
          type="button"
          aria-pressed={isAdminMode}
          onClick={() => setIsAdminMode((current) => !current)}
        >
          {isAdminMode ? "EXIT ADMIN MODE" : "ADMIN MODE"}
        </button>
      </header>

      <Routes>
        <Route path="/" element={<CatalogPage isAdminMode={isAdminMode} />} />
        <Route
          path="/movies/:id"
          element={<MovieRoute isAdminMode={isAdminMode} />}
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

function CatalogPage({ isAdminMode }: { isAdminMode: boolean }) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creationMessage, setCreationMessage] = useState("");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const pageHeadingRef = useRef<HTMLHeadingElement>(null);
  const addFilmButtonRef = useRef<HTMLButtonElement>(null);

  usePageMetadata("The Infinite Archive | CinematheQue", pageHeadingRef);

  useEffect(() => {
    const controller = new AbortController();
    setLoadState("loading");
    setErrorMessage("");

    getMovies({ signal: controller.signal, genre: selectedGenre || undefined })
      .then((data) => {
        setMovies(data);

        if (!selectedGenre) {
          setGenres(
            [...new Set(data.flatMap((movie) => parseGenres(movie.genre)))].sort(
              (first, second) => first.localeCompare(second),
            ),
          );
        }

        setLoadState("success");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;

        setErrorMessage(
          error instanceof Error ? error.message : "An unexpected error occurred.",
        );
        setLoadState("error");
      });

    return () => controller.abort();
  }, [selectedGenre]);

  useEffect(() => {
    if (!isAdminMode && isCreateDialogOpen) setIsCreateDialogOpen(false);
  }, [isAdminMode, isCreateDialogOpen]);

  function closeCreateDialog() {
    setIsCreateDialogOpen(false);
    requestAnimationFrame(() => addFilmButtonRef.current?.focus());
  }

  function handleMovieCreated(createdMovie: Movie) {
    setMovies((current) => [
      createdMovie,
      ...current.filter((movie) => movie.id !== createdMovie.id),
    ]);
    setGenres((current) =>
      [...new Set([...current, ...parseGenres(createdMovie.genre)])].sort(
        (first, second) => first.localeCompare(second),
      ),
    );

    if (
      selectedGenre &&
      !parseGenres(createdMovie.genre).some(
        (genre) => genre.toLocaleLowerCase() === selectedGenre.toLocaleLowerCase(),
      )
    ) {
      setSelectedGenre("");
    }

    setCreationMessage(`“${createdMovie.title}” was added to the archive.`);
    closeCreateDialog();
  }

  return (
    <>
      <main>
        <section className="hero">
          <div className="hero-copy">
            <h1 ref={pageHeadingRef} tabIndex={-1}>
              The infinite
              <br />
              archive
            </h1>
            <p className="intro">Stories worth keeping.</p>
          </div>
        </section>

        <section id="catalog" className="catalog" aria-labelledby="catalog-title">
          <div className="catalog-layout">
            <div className="section-heading">
              <h2 id="catalog-title">All films</h2>

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

                <label className="genre-filter" htmlFor="genre-filter">
                  <span>Filter by genre</span>
                  <select
                    id="genre-filter"
                    value={selectedGenre}
                    onChange={(event) => setSelectedGenre(event.target.value)}
                  >
                    <option value="">All genres</option>
                    {genres.map((genre) => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="catalog-results">
              {loadState === "loading" && (
                <div className="movie-grid" aria-label="Loading movies">
                  {Array.from({ length: 6 }, (_, index) => (
                    <div className="movie-card skeleton" key={index} />
                  ))}
                </div>
              )}

              {loadState === "error" && (
                <div className="message error" role="alert">
                  <strong>The archive could not be opened.</strong>
                  <span>{errorMessage}</span>
                </div>
              )}

              {loadState === "success" && movies.length === 0 && (
                <div className="message">
                  <strong>{selectedGenre ? "No films found." : "The archive is empty."}</strong>
                  <span>
                    {selectedGenre
                      ? "Try selecting another genre."
                      : "Add the first movie to begin the collection."}
                  </span>
                </div>
              )}

              {loadState === "success" && movies.length > 0 && (
                <div className="movie-grid">
                  {movies.map((movie) => {
                    const posterUrl = getMoviePoster(movie.title);
                    const primaryGenre = getPrimaryGenre(movie.genre);
                    const genreDescription = `Genres: ${parseGenres(movie.genre).join(", ")}`;

                    return (
                      <article className="movie-card" key={movie.id}>
                        <Link
                          className="movie-card-trigger"
                          to={`/movies/${movie.id}`}
                          aria-label={`View details for ${movie.title}`}
                        >
                          <div className={`poster poster-${movie.id % 4}`}>
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
                              <span className="poster-letter">{movie.title.charAt(0)}</span>
                            )}
                          </div>

                          <div className="movie-content">
                            <p className="movie-card-genre">
                              <span aria-hidden="true">{primaryGenre}</span>
                              <span className="visually-hidden">{genreDescription}</span>
                            </p>
                            <h3>{movie.title}</h3>
                            <div className="movie-card-meta">
                              <span>{movie.year}</span>
                              <span>{movie.duration} min</span>
                            </div>
                          </div>
                        </Link>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <p className="creation-status" role="status" aria-live="polite" aria-atomic="true">
        {creationMessage}
      </p>

      {isCreateDialogOpen && (
        <MovieCreateDialog onCancel={closeCreateDialog} onCreated={handleMovieCreated} />
      )}
    </>
  );
}

function MovieRoute({ isAdminMode }: { isAdminMode: boolean }) {
  const { id } = useParams();
  const movieId = id && /^\d+$/.test(id) ? Number(id) : Number.NaN;
  const isValidId = Number.isSafeInteger(movieId) && movieId > 0;

  if (!isValidId) {
    return (
      <RouteMessagePage
        title="Invalid movie"
        message="The movie address must contain a valid positive number."
      />
    );
  }

  return <MovieDetailsPage movieId={movieId} isAdminMode={isAdminMode} />;
}

function NotFoundPage() {
  return (
    <RouteMessagePage
      title="Page not found"
      message="The page you requested is not part of the archive."
    />
  );
}

function RouteMessagePage({ title, message }: { title: string; message: string }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  usePageMetadata(`${title} | CinematheQue`, headingRef);

  return (
    <main className="route-message-page">
      <h1 ref={headingRef} tabIndex={-1}>{title}</h1>
      <p>{message}</p>
      <Link to="/">Back to the catalog</Link>
    </main>
  );
}

function usePageMetadata(title: string, headingRef: RefObject<HTMLHeadingElement | null>) {
  useEffect(() => {
    document.title = title;
  }, [title]);

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [headingRef]);
}

export default App;
