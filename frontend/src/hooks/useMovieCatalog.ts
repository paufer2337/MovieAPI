import { useEffect, useState } from "react";
import { getMovies } from "../services/movieApi";
import type { Movie } from "../types/movie";
import { parseGenres } from "../utils/genres";

export type CatalogLoadState = "loading" | "success" | "error";

export function useMovieCatalog(searchQuery: string, selectedGenre: string) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [genres, setGenres] = useState<string[]>([]);
  const [loadState, setLoadState] = useState<CatalogLoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");

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

  function addCreatedMovie(createdMovie: Movie) {
    setMovies((current) => [
      createdMovie,
      ...current.filter((movie) => movie.id !== createdMovie.id),
    ]);
    setGenres((current) =>
      [...new Set([...current, ...parseGenres(createdMovie.genre)])].sort(
        (first, second) => first.localeCompare(second),
      ),
    );

    return Boolean(
      selectedGenre &&
      !parseGenres(createdMovie.genre).some(
        (genre) => genre.toLocaleLowerCase() === selectedGenre.toLocaleLowerCase(),
      ),
    );
  }

  return { addCreatedMovie, errorMessage, genres, loadState, movies };
}
