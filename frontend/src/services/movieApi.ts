import type {
  Movie,
  MovieDetail,
  MovieInput,
  Review,
  ReviewInput,
} from "../types/movie";

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

export async function createMovie(movie: MovieInput): Promise<Movie> {
  const response = await fetch(API_URL, {
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
  const response = await fetch(`${API_URL}/${movieId}/details`, {
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
  const response = await fetch(`${API_URL}/${movieId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(movie),
  });

  if (!response.ok) {
    throw await createApiError(response, "Could not update the movie");
  }
}

export async function deleteMovie(movieId: number): Promise<void> {
  const response = await fetch(`${API_URL}/${movieId}`, {
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
  const response = await fetch(`${API_URL}/${movieId}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(review),
  });

  if (!response.ok) {
    throw await createApiError(response, "Could not submit the review");
  }

  return response.json() as Promise<Review>;
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

    return new Error(
      validationMessage || body.title || `${fallbackMessage} (${response.status}).`,
    );
  } catch {
    return new Error(`${fallbackMessage} (${response.status}).`);
  }
}
