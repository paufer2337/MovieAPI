import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createMovie,
  getMovieDetails,
  getMovies,
  MovieApiError,
} from "./movieApi";
import { makeMovie, makeMovieDetail } from "../test/fixtures";

type FetchImplementation = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

describe("movie API client", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_URL", "https://movies.example.test/api/Movies///");
  });

  it("uses VITE_API_URL and normalizes trailing slashes", async () => {
    const fetchMock = stubFetch(async () => jsonResponse([]));

    await getMovies();

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://movies.example.test/api/Movies?page=1&pageSize=50",
    );
  });

  it("loads all pages sequentially with the same AbortSignal", async () => {
    const movies = Array.from({ length: 75 }, (_, index) =>
      makeMovie({ id: index + 1, title: `Movie ${index + 1}` }),
    );
    const controller = new AbortController();
    const requestedPages: number[] = [];
    const receivedSignals: Array<AbortSignal | null | undefined> = [];
    const fetchMock = stubFetch(async (input, init) => {
      const url = new URL(String(input));
      const page = Number(url.searchParams.get("page"));
      const pageSize = Number(url.searchParams.get("pageSize"));
      requestedPages.push(page);
      receivedSignals.push(init?.signal);
      return jsonResponse(
        movies.slice((page - 1) * pageSize, page * pageSize),
      );
    });

    const result = await getMovies({ signal: controller.signal });

    expect(result).toEqual(movies);
    expect(requestedPages).toEqual([1, 2]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(receivedSignals).toEqual([controller.signal, controller.signal]);
  });

  it("requests one empty terminal page when the catalog is exactly full", async () => {
    const movies = Array.from({ length: 50 }, (_, index) =>
      makeMovie({ id: index + 1 }),
    );
    const requestedPages: number[] = [];
    stubFetch(async (input) => {
      const page = Number(new URL(String(input)).searchParams.get("page"));
      requestedPages.push(page);
      return jsonResponse(page === 1 ? movies : []);
    });

    await expect(getMovies()).resolves.toHaveLength(50);
    expect(requestedPages).toEqual([1, 2]);
  });

  it("preserves AbortError when a request is cancelled", async () => {
    const controller = new AbortController();
    stubFetch(
      (_input, init) =>
        new Promise((_resolve, reject) => {
          const rejectWithAbort = () =>
            reject(new DOMException("The operation was aborted.", "AbortError"));

          if (init?.signal?.aborted) {
            rejectWithAbort();
            return;
          }

          init?.signal?.addEventListener("abort", rejectWithAbort, {
            once: true,
          });
        }),
    );

    const request = getMovies({ signal: controller.signal });
    controller.abort();

    await expect(request).rejects.toMatchObject({ name: "AbortError" });
  });

  it("rejects the whole operation when a later page fails", async () => {
    const firstPage = Array.from({ length: 50 }, (_, index) =>
      makeMovie({ id: index + 1 }),
    );
    const fetchMock = stubFetch(async (input) => {
      const page = Number(new URL(String(input)).searchParams.get("page"));
      return page === 1
        ? jsonResponse(firstPage)
        : jsonResponse({ title: "The second page failed." }, 503);
    });

    await expect(getMovies()).rejects.toThrow("The second page failed.");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("deduplicates movie IDs while preserving first-seen order", async () => {
    const firstPage = Array.from({ length: 50 }, (_, index) =>
      makeMovie({ id: index + 1, title: `Original ${index + 1}` }),
    );
    stubFetch(async (input) => {
      const page = Number(new URL(String(input)).searchParams.get("page"));
      return jsonResponse(
        page === 1
          ? firstPage
          : [
              makeMovie({ id: 50, title: "Duplicate replacement" }),
              makeMovie({ id: 51, title: "New 51" }),
              makeMovie({ id: 52, title: "New 52" }),
            ],
      );
    });

    const result = await getMovies();

    expect(result).toHaveLength(52);
    expect(result.map((movie) => movie.id)).toEqual(
      Array.from({ length: 52 }, (_, index) => index + 1),
    );
    expect(result[49].title).toBe("Original 50");
  });

  it("sends the exact create-movie POST payload", async () => {
    const input = {
      title: "Princess Mononoke",
      year: 1997,
      genre: "Animation/Anime/Fantasy",
      duration: 134,
    };
    const created = makeMovie({ id: 42, ...input });
    const fetchMock = stubFetch(async () => jsonResponse(created, 201));

    await expect(createMovie(input)).resolves.toEqual(created);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://movies.example.test/api/Movies",
    );
    expect(fetchMock.mock.calls[0][1]).toEqual({
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  });

  it("loads one movie detail route with the provided AbortSignal", async () => {
    const detail = makeMovieDetail({ id: 18 });
    const controller = new AbortController();
    const fetchMock = stubFetch(async () => jsonResponse(detail));

    await expect(getMovieDetails(18, controller.signal)).resolves.toEqual(detail);

    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://movies.example.test/api/Movies/18/details",
    );
    expect(fetchMock.mock.calls[0][1]).toEqual({ signal: controller.signal });
  });

  it("preserves the response status on API errors", async () => {
    stubFetch(async () => jsonResponse({ title: "Movie not found." }, 404));

    const request = getMovieDetails(999);

    await expect(request).rejects.toEqual(
      expect.objectContaining<MovieApiError>({
        name: "MovieApiError",
        message: "Movie not found.",
        status: 404,
      }),
    );
  });
});

function stubFetch(implementation: FetchImplementation) {
  const fetchMock = vi.fn(implementation);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => structuredClone(body),
  } as Response;
}
