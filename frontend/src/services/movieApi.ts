import type { Movie } from "../types/movie";

const API_URL = "http://localhost:5000/api/Movies";

type GetMoviesOptions = {
  genre?: string;
  signal?: AbortSignal;
};

export async function getMovies(
  options: GetMoviesOptions = {},
): Promise<Movie[]> {
  const url = new URL(API_URL);
  url.searchParams.set("pageSize", "100");

  if (options.genre) {
    url.searchParams.set("genre", options.genre);
  }

  const response = await fetch(url, {
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`Could not fetch movies (${response.status}).`);
  }

  return response.json() as Promise<Movie[]>;
}
