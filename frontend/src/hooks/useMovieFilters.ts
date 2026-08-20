import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const SEARCH_DEBOUNCE_MS = 300;

export function useMovieFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get("search")?.trim() ?? "";
  const selectedGenre = searchParams.get("genre")?.trim() ?? "";
  const [searchDraft, setSearchDraft] = useState(searchQuery);

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

  function setSelectedGenre(nextGenre: string) {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);

      if (nextGenre) nextParams.set("genre", nextGenre);
      else nextParams.delete("genre");

      return nextParams;
    });
  }

  function clearSelectedGenre() {
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams);
      nextParams.delete("genre");
      return nextParams;
    });
  }

  return {
    clearSelectedGenre,
    searchDraft,
    searchQuery,
    selectedGenre,
    setSearchDraft,
    setSelectedGenre,
  };
}
