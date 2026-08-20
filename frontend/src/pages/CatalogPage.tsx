import { useEffect, useRef, useState } from "react";
import { CatalogControls } from "../components/catalog/CatalogControls";
import { CatalogHero } from "../components/catalog/CatalogHero";
import { CatalogResults } from "../components/catalog/CatalogResults";
import { MovieCreateDialog } from "../components/MovieCreateForm";
import type { HeroRevealState } from "../hooks/useCinematicIntro";
import { useMovieCatalog } from "../hooks/useMovieCatalog";
import { useMovieFilters } from "../hooks/useMovieFilters";
import { usePageMetadata } from "../hooks/usePageMetadata";
import type { Movie } from "../types/movie";

type CatalogPageProps = {
  heroRevealState: HeroRevealState;
  isAdminMode: boolean;
};

export function CatalogPage({
  heroRevealState,
  isAdminMode,
}: CatalogPageProps) {
  const filters = useMovieFilters();
  const catalog = useMovieCatalog(filters.searchQuery, filters.selectedGenre);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creationMessage, setCreationMessage] = useState("");
  const pageHeadingRef = useRef<HTMLHeadingElement>(null);
  const addFilmButtonRef = useRef<HTMLButtonElement>(null);

  usePageMetadata("The Selective Archive | CinematheQue", pageHeadingRef);

  useEffect(() => {
    if (!isAdminMode && isCreateDialogOpen) setIsCreateDialogOpen(false);
  }, [isAdminMode, isCreateDialogOpen]);

  function closeCreateDialog() {
    setIsCreateDialogOpen(false);
    requestAnimationFrame(() => addFilmButtonRef.current?.focus());
  }

  function handleMovieCreated(createdMovie: Movie) {
    if (catalog.addCreatedMovie(createdMovie)) filters.clearSelectedGenre();

    setCreationMessage(`“${createdMovie.title}” was added to the archive.`);
    closeCreateDialog();
  }

  return (
    <>
      <main>
        <CatalogHero
          headingRef={pageHeadingRef}
          revealState={heroRevealState}
        />

        <section id="catalog" className="catalog" aria-labelledby="catalog-title">
          <div className="catalog-layout">
            <div className="section-heading">
              <h2 id="catalog-title">All films</h2>
              <CatalogControls
                addFilmButtonRef={addFilmButtonRef}
                genres={catalog.genres}
                isAdminMode={isAdminMode}
                onAddFilm={() => {
                  setCreationMessage("");
                  setIsCreateDialogOpen(true);
                }}
                onGenreChange={filters.setSelectedGenre}
                onSearchChange={filters.setSearchDraft}
                searchDraft={filters.searchDraft}
                selectedGenre={filters.selectedGenre}
              />
            </div>

            <CatalogResults
              errorMessage={catalog.errorMessage}
              loadState={catalog.loadState}
              movies={catalog.movies}
              searchQuery={filters.searchQuery}
              selectedGenre={filters.selectedGenre}
            />
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
    </>
  );
}
