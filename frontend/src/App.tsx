import { useEffect, useRef, useState, type RefObject } from "react";
import {
  Link,
  Route,
  Routes,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { MovieCreateDialog } from "./components/MovieCreateForm";
import { MovieDetailsPage } from "./components/MovieModal";
import { AdminLoginDialog } from "./components/AdminLoginDialog";
import { getMoviePoster } from "./data/moviePosters";
import { getMovies } from "./services/movieApi";
import {
  AUTH_SESSION_INVALIDATED_EVENT,
  clearAuthSession,
  getStoredAuthSession,
  invalidateAuthSession,
  type AuthInvalidationReason,
  type AuthSession,
} from "./services/auth";
import type { Movie } from "./types/movie";
import { getPrimaryGenre, parseGenres } from "./utils/genres";
import "./App.css";

type LoadState = "loading" | "success" | "error";
const SEARCH_DEBOUNCE_MS = 300;

function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(() =>
    getStoredAuthSession(),
  );
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const authButtonRef = useRef<HTMLButtonElement>(null);
  const isAdminMode = authSession !== null;

  useEffect(() => {
    function handleInvalidatedSession(event: Event) {
      const reason = (event as CustomEvent<AuthInvalidationReason>).detail;
      setAuthSession(null);
      setIsLoginDialogOpen(false);
      setAuthMessage(
        reason === "expired"
          ? "Your admin session expired. Please log in again."
          : "Your admin session ended because authorization failed.",
      );
    }

    window.addEventListener(
      AUTH_SESSION_INVALIDATED_EVENT,
      handleInvalidatedSession,
    );
    return () =>
      window.removeEventListener(
        AUTH_SESSION_INVALIDATED_EVENT,
        handleInvalidatedSession,
      );
  }, []);

  useEffect(() => {
    if (!authSession) return;

    const millisecondsUntilExpiry =
      Date.parse(authSession.expiresAtUtc) - Date.now();
    if (millisecondsUntilExpiry <= 0) {
      invalidateAuthSession("expired");
      return;
    }

    const timeoutId = window.setTimeout(
      () => invalidateAuthSession("expired"),
      millisecondsUntilExpiry,
    );
    return () => window.clearTimeout(timeoutId);
  }, [authSession]);

  function handleAuthenticated(session: AuthSession) {
    setAuthSession(session);
    setIsLoginDialogOpen(false);
    setAuthMessage("");
    requestAnimationFrame(() => authButtonRef.current?.focus());
  }

  function handleLogout() {
    clearAuthSession();
    setAuthSession(null);
    setAuthMessage("You have logged out of admin mode.");
  }

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
          ref={authButtonRef}
          className={`admin-mode-toggle${isAdminMode ? " admin-session-active" : ""}`}
          type="button"
          aria-haspopup={isAdminMode ? undefined : "dialog"}
          onClick={() => {
            setAuthMessage("");
            if (isAdminMode) handleLogout();
            else setIsLoginDialogOpen(true);
          }}
        >
          {isAdminMode ? "LOGOUT" : "ADMIN LOGIN"}
        </button>
      </header>

      {authMessage && (
        <p className="auth-status" role="status" aria-live="polite">
          {authMessage}
        </p>
      )}

      {isLoginDialogOpen && (
        <AdminLoginDialog
          onAuthenticated={handleAuthenticated}
          onCancel={() => {
            setIsLoginDialogOpen(false);
            requestAnimationFrame(() => authButtonRef.current?.focus());
          }}
        />
      )}

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
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search")?.trim() ?? "";
  const selectedGenre = searchParams.get("genre")?.trim() ?? "";
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [searchDraft, setSearchDraft] = useState(searchQuery);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creationMessage, setCreationMessage] = useState("");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const pageHeadingRef = useRef<HTMLHeadingElement>(null);
  const addFilmButtonRef = useRef<HTMLButtonElement>(null);

  usePageMetadata("The Selective Archive | CinematheQue", pageHeadingRef);

  useEffect(() => {
    setSearchDraft(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const normalizedSearch = searchDraft.trim();
    if (normalizedSearch === searchQuery) return;

    const timeoutId = window.setTimeout(() => {
      setSearchParams((currentParams) => {
        const nextParams = new URLSearchParams(currentParams);

        if (normalizedSearch) nextParams.set("search", normalizedSearch);
        else nextParams.delete("search");

        return nextParams;
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [searchDraft, searchQuery, setSearchParams]);

  useEffect(() => {
    const controller = new AbortController();
    setLoadState("loading");
    setErrorMessage("");

    getMovies({
      signal: controller.signal,
      genre: selectedGenre || undefined,
      search: searchQuery || undefined,
    })
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
  }, [searchQuery, selectedGenre]);

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
      setSearchParams((currentParams) => {
        const nextParams = new URLSearchParams(currentParams);
        nextParams.delete("genre");
        return nextParams;
      });
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
              The
              <br />
              selective
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
                ) : null}

                <label className="search-filter" htmlFor="movie-search">
                  <span>Search films</span>
                  <input
                    id="movie-search"
                    type="search"
                    value={searchDraft}
                    onChange={(event) => setSearchDraft(event.target.value)}
                    placeholder="Search by title"
                  />
                </label>

                <label className="genre-filter" htmlFor="genre-filter">
                  <span>Filter by genre</span>
                  <select
                    id="genre-filter"
                    value={selectedGenre}
                    onChange={(event) => {
                      const nextGenre = event.target.value;
                      setSearchParams((currentParams) => {
                        const nextParams = new URLSearchParams(currentParams);

                        if (nextGenre) nextParams.set("genre", nextGenre);
                        else nextParams.delete("genre");

                        return nextParams;
                      });
                    }}
                  >
                    <option value="">All genres</option>
                    {selectedGenre &&
                      !genres.some(
                        (genre) =>
                          genre.toLocaleLowerCase() ===
                          selectedGenre.toLocaleLowerCase(),
                      ) && <option value={selectedGenre}>{selectedGenre}</option>}
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
                  <strong>
                    {searchQuery || selectedGenre
                      ? "No films found."
                      : "The archive is empty."}
                  </strong>
                  <span>
                    {searchQuery || selectedGenre
                      ? "Try changing your search or genre."
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
