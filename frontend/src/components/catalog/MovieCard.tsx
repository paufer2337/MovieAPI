import { Link } from "react-router-dom";
import { getMoviePoster } from "../../data/moviePosters";
import type { Movie } from "../../types/movie";
import { getPrimaryGenre, parseGenres } from "../../utils/genres";

export function MovieCard({ movie }: { movie: Movie }) {
  const posterUrl = getMoviePoster(movie.title);
  const primaryGenre = getPrimaryGenre(movie.genre);
  const genreDescription = `Genres: ${parseGenres(movie.genre).join(", ")}`;

  return (
    <article className="movie-card">
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
}
