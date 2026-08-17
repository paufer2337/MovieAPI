import type { Movie } from "../types/movie";

const API_URL = "http://localhost:5000/api/Movies";

export async function getMovies(
  signal?: AbortSignal,
): Promise<Movie[]> {
  const response = await fetch(API_URL, { signal });

  if (!response.ok) {
    throw new Error(`Could not fetch movies (${response.status}).`);
  }

  return response.json() as Promise<Movie[]>;
}