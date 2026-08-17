import { useEffect, useMemo, useState } from "react";
import { getMoviePoster } from "./data/moviePosters";
import { getMovies } from "./services/movieApi";
import type { Movie } from "./types/movie";
import "./App.css";

type LoadState = "loading" | "success" | "error";

function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    getMovies(controller.signal)
      .then((data) => {
        setMovies(data);
        setLoadState("success");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
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
  }, []);

  const totalRuntime = useMemo(
    () => movies.reduce((sum, movie) => sum + movie.duration, 0),
    [movies],
  );

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="/" aria-label="Cinematheque home">
          <span className="brand-monogram">CQ</span>
          <span className="brand-edition">11</span>
          <span>CinematheQue</span>
        </a>

        <span className="header-label">
          Movie archive · Exercise 11
        </span>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">The permanent collection</p>

            <h1>
              Stories worth
              <br />
              keeping.
            </h1>

            <p className="intro">
              A living film archive connected directly to our ASP.NET Core
              API.
            </p>
          </div>

          <div className="hero-stats">
            <div>
              <strong>{movies.length}</strong>
              <span>Films</span>
            </div>

            <div>
              <strong>{totalRuntime}</strong>
              <span>Minutes</span>
            </div>
          </div>
        </section>

        <section className="catalog" aria-labelledby="catalog-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Archive index</p>
              <h2 id="catalog-title">All films</h2>
            </div>

            <span className="count">{movies.length} titles</span>
          </div>

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
              <strong>The archive is empty.</strong>
              <span>Add the first movie to begin the collection.</span>
            </div>
          )}

          {loadState === "success" && movies.length > 0 && (
            <div className="movie-grid">
              {movies.map((movie, index) => {
                const posterUrl = getMoviePoster(movie.title);

                return (
                  <article className="movie-card" key={movie.id}>
                    <div
                      className={`poster poster-${movie.id % 4}`}
                      aria-hidden="true"
                    >
                      {posterUrl ? (
                        <img
                          className="poster-image"
                          src={posterUrl}
                          alt=""
                          width="800"
                          height="1200"
                          loading="lazy"
                        />
                      ) : (
                        <span className="poster-letter">
                          {movie.title.charAt(0)}
                        </span>
                      )}

                      <span className="poster-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <span className="poster-year">{movie.year}</span>
                    </div>

                    <div className="movie-content">
                      <p>{movie.genre}</p>
                      <h3>{movie.title}</h3>
                      <span>{movie.duration} minutes</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;