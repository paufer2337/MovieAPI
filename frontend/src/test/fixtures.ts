import type { Movie, MovieDetail } from "../types/movie";

export function makeMovie(overrides: Partial<Movie> = {}): Movie {
  return {
    id: 1,
    title: "Spirited Away",
    year: 2001,
    genre: "Animation/Anime/Fantasy",
    duration: 125,
    ...overrides,
  };
}

export function makeMovieDetail(
  overrides: Partial<MovieDetail> = {},
): MovieDetail {
  return {
    ...makeMovie(),
    details: {
      synopsis: "A young girl enters a mysterious spirit world.",
      language: "Japanese",
      budget: 19_000_000,
    },
    actors: [],
    reviews: [],
    ...overrides,
  };
}

export function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });

  return { promise, reject, resolve };
}
