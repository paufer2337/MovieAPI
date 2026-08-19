import type {
  Actor,
  Movie,
  MovieDetail,
  MovieInput,
  Review,
  ReviewInput,
} from "../types/movie";
import {
  getStoredAuthSession,
  invalidateAuthSession,
} from "./auth";
import { buildMovieApiUrl, buildSiblingApiUrl } from "./apiUrl";

const MOVIE_PAGE_SIZE = 50;
const MAX_PAGE_REQUESTS = 1_000;

type MoviePageResponse = Movie[];

type GetMoviesOptions = {
  genre?: string;
  search?: string;
  signal?: AbortSignal;
};

export class MovieApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "MovieApiError";
    this.status = status;
  }
}

export async function getMovies(
  options: GetMoviesOptions = {},
): Promise<Movie[]> {
  const moviesById = new Map<number, Movie>();

  for (let page = 1; page <= MAX_PAGE_REQUESTS; page += 1) {
    const url = buildMovieApiUrl();
    url.searchParams.set("page", String(page));
    url.searchParams.set("pageSize", String(MOVIE_PAGE_SIZE));

    if (options.genre) {
      url.searchParams.set("genre", options.genre);
    }

    if (options.search) {
      url.searchParams.set("search", options.search);
    }

    const response = await fetch(url, {
      signal: options.signal,
    });

    if (!response.ok) {
      throw await createApiError(response, `Could not fetch movie page ${page}`);
    }

    const moviePage = await readMoviePage(response);
    let newMoviesOnPage = 0;

    for (const movie of moviePage) {
      if (!moviesById.has(movie.id)) {
        moviesById.set(movie.id, movie);
        newMoviesOnPage += 1;
      }
    }

    if (moviePage.length < MOVIE_PAGE_SIZE) {
      return [...moviesById.values()];
    }

    if (newMoviesOnPage === 0) {
      throw new Error(
        "The Movie API repeated a full page. The complete catalog could not be loaded safely.",
      );
    }
  }

  throw new Error(
    "The Movie API returned too many pages without reaching the end of the catalog.",
  );
}

export async function createMovie(movie: MovieInput): Promise<Movie> {
  const response = await fetch(buildMovieApiUrl(), {
    method: "POST",
    headers: createAdminHeaders(true),
    body: JSON.stringify(movie),
  });

  if (!response.ok) {
    throw await createApiError(response, "Could not create the movie");
  }

  return response.json() as Promise<Movie>;
}

export async function getMovieDetails(
  movieId: number,
  signal?: AbortSignal,
): Promise<MovieDetail> {
  const response = await fetch(buildMovieApiUrl(`${movieId}/details`), {
    signal,
  });

  if (!response.ok) {
    throw await createApiError(response, "Could not fetch movie details");
  }

  return response.json() as Promise<MovieDetail>;
}

export async function getActors(signal?: AbortSignal): Promise<Actor[]> {
  const response = await fetch(buildSiblingApiUrl("actors"), { signal });

  if (!response.ok) {
    throw await createApiError(response, "Could not fetch actors");
  }

  return readActors(response);
}

export async function addMovieActor(
  movieId: number,
  actorId: number,
  role: string,
): Promise<Actor> {
  const response = await fetch(
    buildMovieApiUrl(`${movieId}/actors/${actorId}`),
    {
      method: "POST",
      headers: createAdminHeaders(true),
      body: JSON.stringify({ role }),
    },
  );

  if (!response.ok) {
    throw await createApiError(response, "Could not add the actor to the movie");
  }

  return readActor(response);
}

export async function updateMovie(
  movieId: number,
  movie: MovieInput,
): Promise<void> {
  const response = await fetch(buildMovieApiUrl(String(movieId)), {
    method: "PUT",
    headers: createAdminHeaders(true),
    body: JSON.stringify(movie),
  });

  if (!response.ok) {
    throw await createApiError(response, "Could not update the movie");
  }
}

export async function deleteMovie(movieId: number): Promise<void> {
  const response = await fetch(buildMovieApiUrl(String(movieId)), {
    method: "DELETE",
    headers: createAdminHeaders(),
  });

  if (!response.ok) {
    throw await createApiError(response, "Could not delete the movie");
  }
}

export async function createReview(
  movieId: number,
  review: ReviewInput,
): Promise<Review> {
  const response = await fetch(buildMovieApiUrl(`${movieId}/reviews`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(review),
  });

  if (!response.ok) {
    throw await createApiError(response, "Could not submit the review");
  }

  return response.json() as Promise<Review>;
}

function createAdminHeaders(includeJson = false): Record<string, string> {
  const session = getStoredAuthSession();
  if (!session) {
    invalidateAuthSession("expired");
    throw new MovieApiError(
      "Your admin session has expired. Please log in again.",
      401,
    );
  }

  return {
    ...(includeJson ? { "Content-Type": "application/json" } : {}),
    Authorization: `Bearer ${session.token}`,
  };
}

async function readMoviePage(response: Response): Promise<MoviePageResponse> {
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error("The Movie API returned a movie page that was not valid JSON.");
  }

  if (!Array.isArray(body) || !body.every(isMovie)) {
    throw new Error("The Movie API returned an invalid movie page response.");
  }

  if (body.length > MOVIE_PAGE_SIZE) {
    throw new Error("The Movie API returned more movies than the requested page size.");
  }

  return body;
}

function isMovie(value: unknown): value is Movie {
  if (typeof value !== "object" || value === null) return false;

  const movie = value as Record<string, unknown>;
  return (
    typeof movie.id === "number" &&
    Number.isInteger(movie.id) &&
    typeof movie.title === "string" &&
    typeof movie.year === "number" &&
    Number.isInteger(movie.year) &&
    typeof movie.genre === "string" &&
    typeof movie.duration === "number" &&
    Number.isInteger(movie.duration)
  );
}

async function readActors(response: Response): Promise<Actor[]> {
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error("The Movie API returned an actor list that was not valid JSON.");
  }

  if (!Array.isArray(body) || !body.every(isActor)) {
    throw new Error("The Movie API returned an invalid actor list response.");
  }

  return body;
}

async function readActor(response: Response): Promise<Actor> {
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error("The Movie API returned an actor that was not valid JSON.");
  }

  if (!isActor(body)) {
    throw new Error("The Movie API returned an invalid actor response.");
  }

  return body;
}

function isActor(value: unknown): value is Actor {
  if (typeof value !== "object" || value === null) return false;

  const actor = value as Record<string, unknown>;
  return (
    typeof actor.id === "number" &&
    Number.isInteger(actor.id) &&
    typeof actor.name === "string" &&
    typeof actor.birthYear === "number" &&
    Number.isInteger(actor.birthYear) &&
    typeof actor.role === "string"
  );
}

async function createApiError(
  response: Response,
  fallbackMessage: string,
): Promise<Error> {
  if (response.status === 401) {
    invalidateAuthSession("unauthorized");
  }

  try {
    const body = (await response.json()) as {
      errors?: Record<string, string[]>;
      title?: string;
    };
    const validationMessage = body.errors
      ? Object.values(body.errors).flat().join(" ")
      : undefined;

    return new MovieApiError(
      validationMessage || body.title || `${fallbackMessage} (${response.status}).`,
      response.status,
    );
  } catch {
    return new MovieApiError(
      `${fallbackMessage} (${response.status}).`,
      response.status,
    );
  }
}
