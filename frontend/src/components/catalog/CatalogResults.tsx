import type { CatalogLoadState } from "../../hooks/useMovieCatalog";
import type { Movie } from "../../types/movie";
import { MovieCard } from "./MovieCard";

type CatalogResultsProps = {
  errorMessage: string;
  loadState: CatalogLoadState;
  movies: Movie[];
  searchQuery: string;
  selectedGenre: string;
};

export function CatalogResults({
  errorMessage,
  loadState,
  movies,
  searchQuery,
  selectedGenre,
}: CatalogResultsProps) {
  return (
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
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      )}
    </div>
  );
}
