import { buildSiblingApiUrl } from "./apiUrl";

export type TopMoviesByGenre = {
  genre: string;
  movies: Array<{
    rank: number;
    movieId: number;
    title: string;
    averageRating: number | null;
    reviewCount: number;
  }>;
};

export type MovieAverageRating = {
  movieId: number;
  title: string;
  averageRating: number | null;
  reviewCount: number;
};

export type ActiveActor = {
  rank: number;
  actorId: number;
  name: string;
  movieCount: number;
};

export type DashboardReports = {
  topMoviesByGenre: TopMoviesByGenre[];
  averageRatings: MovieAverageRating[];
  mostActiveActors: ActiveActor[];
};

export async function getDashboardReports(
  signal?: AbortSignal,
): Promise<DashboardReports> {
  const [topMoviesByGenre, averageRatings, mostActiveActors] = await Promise.all([
    getReport<TopMoviesByGenre[]>("top-movies-by-genre", signal),
    getReport<MovieAverageRating[]>("average-ratings", signal),
    getReport<ActiveActor[]>("most-active-actors", signal),
  ]);

  return { topMoviesByGenre, averageRatings, mostActiveActors };
}

async function getReport<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(buildSiblingApiUrl("reports", path), { signal });
  if (!response.ok) throw new Error(`Could not load dashboard report (${response.status}).`);
  return response.json() as Promise<T>;
}
