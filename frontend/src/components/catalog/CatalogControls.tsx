import type { RefObject } from "react";

type CatalogControlsProps = {
  addFilmButtonRef: RefObject<HTMLButtonElement | null>;
  genres: string[];
  isAdminMode: boolean;
  onAddFilm: () => void;
  onGenreChange: (genre: string) => void;
  onSearchChange: (search: string) => void;
  searchDraft: string;
  selectedGenre: string;
};

export function CatalogControls({
  addFilmButtonRef,
  genres,
  isAdminMode,
  onAddFilm,
  onGenreChange,
  onSearchChange,
  searchDraft,
  selectedGenre,
}: CatalogControlsProps) {
  return (
    <div className="catalog-controls">
      {isAdminMode ? (
        <button
          ref={addFilmButtonRef}
          className="add-film-button"
          type="button"
          aria-haspopup="dialog"
          onClick={onAddFilm}
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
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search by title"
        />
      </label>

      <label className="genre-filter" htmlFor="genre-filter">
        <span>Filter by genre</span>
        <select
          id="genre-filter"
          value={selectedGenre}
          onChange={(event) => onGenreChange(event.target.value)}
        >
          <option value="">All genres</option>
          {selectedGenre &&
            !genres.some(
              (genre) =>
                genre.toLocaleLowerCase() === selectedGenre.toLocaleLowerCase(),
            ) && <option value={selectedGenre}>{selectedGenre}</option>}
          {genres.map((genre) => (
            <option key={genre} value={genre}>{genre}</option>
          ))}
        </select>
      </label>
    </div>
  );
}
