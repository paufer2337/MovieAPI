import type {
  Movie,
  MovieDetail,
  MovieInput,
  Review,
  ReviewInput,
} from "../types/movie";

const DEVELOPMENT_API_URL = "http://localhost:5000/api/Movies";
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
    const url = buildApiUrl();
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
  const response = await fetch(buildApiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
  const response = await fetch(buildApiUrl(`${movieId}/details`), {
    signal,
  });

  if (!response.ok) {
    throw await createApiError(response, "Could not fetch movie details");
  }

  return response.json() as Promise<MovieDetail>;
}

export async function updateMovie(
  movieId: number,
  movie: MovieInput,
): Promise<void> {
  const response = await fetch(buildApiUrl(String(movieId)), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(movie),
  });

  if (!response.ok) {
    throw await createApiError(response, "Could not update the movie");
  }
}

export async function deleteMovie(movieId: number): Promise<void> {
  const response = await fetch(buildApiUrl(String(movieId)), {
    method: "DELETE",
  });

  if (!response.ok) {
    throw await createApiError(response, "Could not delete the movie");
  }
}

export async function createReview(
  movieId: number,
  review: ReviewInput,
): Promise<Review> {
  const response = await fetch(buildApiUrl(`${movieId}/reviews`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(review),
  });

  if (!response.ok) {
    throw await createApiError(response, "Could not submit the review");
  }

  return response.json() as Promise<Review>;
}

function buildApiUrl(path = ""): URL {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.replace(/^\/+/, "");
  return new URL(normalizedPath ? `${baseUrl}/${normalizedPath}` : baseUrl);
}

function getApiBaseUrl(): string {
  const configuredUrl = import.meta.env.VITE_API_URL?.trim();
  const candidate =
    configuredUrl || (import.meta.env.DEV ? DEVELOPMENT_API_URL : undefined);

  if (!candidate) {
    throw new Error(
      "The Movie API is not configured. Set VITE_API_URL for this deployment.",
    );
  }

  const normalizedUrl = candidate.replace(/\/+$/, "");

  try {
    const parsedUrl = new URL(normalizedUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error();
    }
  } catch {
    throw new Error(
      "The Movie API configuration is invalid. VITE_API_URL must be an absolute HTTP or HTTPS URL.",
    );
  }

  return normalizedUrl;
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

async function createApiError(
  response: Response,
  fallbackMessage: string,
): Promise<Error> {
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
