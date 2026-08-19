import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App, { INTRO_SESSION_STORAGE_KEY } from "./App";
import { MovieApiError } from "./services/movieApi";
import {
  AUTH_EXPIRY_STORAGE_KEY,
  AUTH_TOKEN_STORAGE_KEY,
  AuthApiError,
  invalidateAuthSession,
  storeAuthSession,
} from "./services/auth";
import { runAxe } from "./test/axe";
import { deferred, makeMovie, makeMovieDetail } from "./test/fixtures";

const apiMocks = vi.hoisted(() => ({
  addMovieActor: vi.fn(),
  createMovie: vi.fn(),
  createReview: vi.fn(),
  deleteMovie: vi.fn(),
  getActors: vi.fn(),
  getMovieDetails: vi.fn(),
  getMovies: vi.fn(),
  updateMovie: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  loginAdmin: vi.fn(),
}));

vi.mock("./services/movieApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./services/movieApi")>()),
  ...apiMocks,
}));

vi.mock("./services/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./services/auth")>()),
  loginAdmin: authMocks.loginAdmin,
}));

const catalogMovie = makeMovie({
  id: 7,
  title: "Howl's Moving Castle",
  genre: "Fantasy/Anime/Adventure",
  year: 2004,
  duration: 119,
});

const catalogDetail = makeMovieDetail({
  ...catalogMovie,
  actors: [
    { id: 3, name: "Chieko Baisho", birthYear: 1941, role: "Sophie" },
  ],
  reviews: [
    { id: 4, reviewerName: "Mira", rating: 5, comment: "A magical classic." },
  ],
});

describe("App administration and create dialog", () => {
  beforeEach(resetApiMocks);

  it("starts in user mode and exposes mutation controls only in admin mode", async () => {
    const user = userEvent.setup();
    renderApp();

    const adminButton = screen.getByRole("button", { name: "ADMIN LOGIN" });
    expect(screen.queryByRole("link", { name: "DASHBOARD" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "+ ADD FILM" })).not.toBeInTheDocument();

    await user.click(await findMovieLink());
    await screen.findByRole("heading", { level: 1, name: catalogMovie.title });
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();

    await logInAsAdmin(user, adminButton);

    expect(screen.getByRole("button", { name: "LOGOUT" })).toBeVisible();
    expect(screen.getByRole("link", { name: "DASHBOARD" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByRole("button", { name: "Edit" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Delete" })).toBeVisible();

    await user.click(screen.getByRole("link", { name: /back to the catalog/i }));
    expect(await screen.findByRole("button", { name: "+ ADD FILM" })).toBeVisible();
  });

  it("opens an accessibly named create dialog and restores focus after Cancel", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole("heading", { name: catalogMovie.title });
    await enterAdminMode(user);
    const addButton = screen.getByRole("button", { name: "+ ADD FILM" });

    await user.click(addButton);

    const dialog = screen.getByRole("dialog", { name: "Add a film" });
    expect(dialog).toHaveAttribute("open");
    expect(screen.getByLabelText("Title")).toHaveFocus();
    expect((await runAxe(dialog)).violations).toEqual([]);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog", { name: "Add a film" })).not.toBeInTheDocument();
    await waitFor(() => expect(addButton).toHaveFocus());
  });

  it("handles the dialog cancel event used by Escape", async () => {
    const user = userEvent.setup();
    renderApp();
    await screen.findByRole("heading", { name: catalogMovie.title });
    await enterAdminMode(user);
    const addButton = screen.getByRole("button", { name: "+ ADD FILM" });
    await user.click(addButton);
    const dialog = screen.getByRole("dialog", { name: "Add a film" });

    fireEvent(dialog, new Event("cancel", { cancelable: true }));

    expect(screen.queryByRole("dialog", { name: "Add a film" })).not.toBeInTheDocument();
    await waitFor(() => expect(addButton).toHaveFocus());
  });

  it("adds a created movie, announces success, and updates the catalog", async () => {
    const user = userEvent.setup();
    const created = makeMovie({
      id: 99,
      title: "Princess Mononoke",
      year: 1997,
      genre: "Anime/Fantasy",
      duration: 134,
    });
    apiMocks.createMovie.mockResolvedValue(created);
    renderApp();
    await screen.findByRole("heading", { name: catalogMovie.title });
    await enterAdminMode(user);
    const addButton = screen.getByRole("button", { name: "+ ADD FILM" });
    await user.click(addButton);
    await fillCreateDialog(user);

    await user.click(screen.getByRole("button", { name: "Add film" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "“Princess Mononoke” was added to the archive.",
    );
    expect(screen.getByRole("heading", { name: "Princess Mononoke" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Add a film" })).not.toBeInTheDocument();
    await waitFor(() => expect(addButton).toHaveFocus());
  });
});

describe("Cinematic intro", () => {
  beforeEach(resetApiMocks);

  it("shows the intro on the first catalog visit in a session", () => {
    renderApp();

    expect(screen.getByTestId("cinematic-intro")).toBeInTheDocument();
    expect(screen.getByTestId("intro-logo")).toHaveAttribute(
      "src",
      "/images/intro-logo.png",
    );
    expect(screen.getByTestId("intro-logo")).toHaveAttribute("alt", "");
    expect(screen.getByRole("button", { name: "Skip intro" })).toBeVisible();
  });

  it("skips the intro when the session marker already exists", () => {
    sessionStorage.setItem(INTRO_SESSION_STORAGE_KEY, "true");
    renderApp();

    expect(screen.queryByTestId("cinematic-intro")).not.toBeInTheDocument();
  });

  it("does not show the intro on the dashboard", () => {
    renderApp("/dashboard");

    expect(screen.queryByTestId("cinematic-intro")).not.toBeInTheDocument();
  });

  it("removes the overlay immediately when the intro is skipped", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: "Skip intro" }));

    expect(screen.queryByTestId("cinematic-intro")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: /selective/i }))
      .toBeVisible();
    expect(sessionStorage.getItem(INTRO_SESSION_STORAGE_KEY)).toBe("true");
  });

  it("navigates to the dashboard and applies its active button style", async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(INTRO_SESSION_STORAGE_KEY, "true");
    storeAuthSession(validSession());
    const { router } = renderApp();
    const dashboardLink = screen.getByRole("link", { name: "DASHBOARD" });

    expect(dashboardLink).not.toHaveClass("admin-session-active");
    await user.click(dashboardLink);

    expect(router.state.location.pathname).toBe("/dashboard");
    expect(dashboardLink).toHaveClass("admin-session-active");
  });

  it("never leaves a blocking overlay if an animation event is missed", () => {
    vi.useFakeTimers();

    try {
      renderApp();
      act(() => vi.advanceTimersByTime(9_000));

      expect(screen.queryByTestId("cinematic-intro")).not.toBeInTheDocument();
      expect(sessionStorage.getItem(INTRO_SESSION_STORAGE_KEY)).toBe("true");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("App routing and movie details", () => {
  beforeEach(resetApiMocks);

  it("renders the catalog with real movie links and catalog page metadata", async () => {
    renderApp();

    const heading = screen.getByRole("heading", { level: 1, name: /selective/i });
    expect(heading).toHaveFocus();
    expect(document.title).toBe("The Selective Archive | CinematheQue");
    expect(await findMovieLink()).toHaveAttribute("href", "/movies/7");
  });

  it("navigates to a movie page and shows all detail sections", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(await findMovieLink());

    const heading = await screen.findByRole("heading", {
      level: 1,
      name: catalogMovie.title,
    });
    expect(heading).toHaveFocus();
    expect(document.title).toBe(`${catalogMovie.title} | CinematheQue`);
    expect(screen.getByText("Fantasy · Anime · Adventure")).toBeInTheDocument();
    expect(screen.getByText(catalogDetail.details!.synopsis)).toBeInTheDocument();
    expect(screen.getByText("Japanese")).toBeInTheDocument();
    expect(screen.getByText("$19,000,000")).toBeInTheDocument();
    expect(apiMocks.getMovieDetails).toHaveBeenCalledWith(7, expect.any(AbortSignal));

    await user.click(screen.getByRole("tab", { name: "Cast" }));
    expect(screen.getByText("Chieko Baisho")).toBeInTheDocument();
    expect(screen.getByText("Sophie")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Reviews" }));
    expect(screen.getByText("A magical classic.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Leave a review" })).toBeInTheDocument();
    expect((await runAxe(document.body)).violations).toEqual([]);
  });

  it("loads a direct movie URL and posts a review that appears immediately", async () => {
    const user = userEvent.setup();
    const createdReview = {
      id: 42,
      reviewerName: "Noah",
      rating: 4,
      comment: "Beautifully animated and memorable.",
    };
    apiMocks.createReview.mockResolvedValue(createdReview);
    renderApp("/movies/7");

    await screen.findByRole("heading", { level: 1, name: catalogMovie.title });
    await user.click(screen.getByRole("tab", { name: "Reviews" }));
    await user.type(screen.getByLabelText("Reviewer"), " Noah ");
    await user.selectOptions(screen.getByLabelText("Rating"), "4");
    await user.type(
      screen.getByLabelText("Comment"),
      " Beautifully animated and memorable. ",
    );
    await user.click(screen.getByRole("button", { name: "Submit review" }));

    expect(apiMocks.createReview).toHaveBeenCalledWith(7, {
      reviewerName: "Noah",
      rating: 4,
      comment: "Beautifully animated and memorable.",
    });
    expect(await screen.findByText(createdReview.comment)).toBeInTheDocument();
  });

  it("keeps edit and delete behavior available in admin mode", async () => {
    const user = userEvent.setup();
    apiMocks.updateMovie.mockResolvedValue(undefined);
    apiMocks.deleteMovie.mockResolvedValue(undefined);
    renderApp("/movies/7");
    await screen.findByRole("heading", { level: 1, name: catalogMovie.title });
    await enterAdminMode(user);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const titleInput = screen.getByLabelText("Title");
    await user.clear(titleInput);
    await user.type(titleInput, "Howl's Castle");
    await user.click(screen.getByRole("button", { name: "Save changes" }));

    expect(apiMocks.updateMovie).toHaveBeenCalledWith(7, {
      title: "Howl's Castle",
      year: 2004,
      genre: "Fantasy/Anime/Adventure",
      duration: 119,
    });
    expect(
      await screen.findByRole("heading", { level: 1, name: "Howl's Castle" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("alertdialog", { name: "Delete “Howl's Castle”?" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Delete film" }));

    expect(apiMocks.deleteMovie).toHaveBeenCalledWith(7);
    expect(
      await screen.findByRole("heading", { level: 1, name: /selective/i }),
    ).toBeInTheDocument();
  });

  it("returns to the catalog through the back link and focuses its h1", async () => {
    const user = userEvent.setup();
    renderApp("/movies/7");
    await screen.findByRole("heading", { level: 1, name: catalogMovie.title });

    await user.click(screen.getByRole("link", { name: /back to the catalog/i }));

    const catalogHeading = await screen.findByRole("heading", {
      level: 1,
      name: /selective/i,
    });
    expect(catalogHeading).toHaveFocus();
    expect(document.title).toBe("The Selective Archive | CinematheQue");
  });

  it("rejects invalid movie IDs without calling the API", () => {
    renderApp("/movies/not-a-number");

    const heading = screen.getByRole("heading", { level: 1, name: "Invalid movie" });
    expect(heading).toHaveFocus();
    expect(document.title).toBe("Invalid movie | CinematheQue");
    expect(apiMocks.getMovieDetails).not.toHaveBeenCalled();
  });

  it("shows a dedicated not-found state for a missing movie", async () => {
    apiMocks.getMovieDetails.mockRejectedValue(
      new MovieApiError("Could not fetch movie details (404).", 404),
    );
    renderApp("/movies/404");

    const heading = await screen.findByRole("heading", {
      level: 1,
      name: "Film not found",
    });
    expect(heading).toHaveFocus();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This film does not exist in the archive.",
    );
    expect(document.title).toBe("Film not found | CinematheQue");
  });

  it("shows loading and accessible API errors", async () => {
    apiMocks.getMovieDetails.mockRejectedValue(new Error("Service unavailable."));
    renderApp("/movies/7");

    expect(screen.getByRole("status")).toHaveTextContent("Loading film details");
    expect(await screen.findByRole("alert")).toHaveTextContent("Service unavailable.");
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { level: 1, name: "Movie details" }),
      ).toHaveFocus(),
    );
  });

  it("shows a Not Found page for unknown routes", () => {
    renderApp("/somewhere-else");

    const heading = screen.getByRole("heading", { level: 1, name: "Page not found" });
    expect(heading).toHaveFocus();
    expect(document.title).toBe("Page not found | CinematheQue");
    expect(screen.getByRole("link", { name: "Back to the catalog" })).toBeVisible();
  });
});

describe("Admin login session", () => {
  beforeEach(resetApiMocks);

  it("shows an accessible login form and prevents duplicate submissions", async () => {
    const user = userEvent.setup();
    const pendingLogin = deferred<{
      token: string;
      expiresAtUtc: string;
    }>();
    authMocks.loginAdmin.mockReturnValue(pendingLogin.promise);
    renderApp();

    await user.click(screen.getByRole("button", { name: "ADMIN LOGIN" }));
    const dialog = screen.getByRole("dialog", { name: "Admin login" });
    expect(screen.getByLabelText("Username")).toHaveFocus();
    expect((await runAxe(dialog)).violations).toEqual([]);

    await user.type(screen.getByLabelText("Username"), "admin");
    await user.type(screen.getByLabelText("Password"), "secret");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    const loadingButton = screen.getByRole("button", { name: "Logging in…" });
    expect(loadingButton).toBeDisabled();
    await user.click(loadingButton);
    expect(authMocks.loginAdmin).toHaveBeenCalledOnce();

    await act(() => pendingLogin.resolve(validSession()));
    expect(await screen.findByRole("button", { name: "LOGOUT" })).toBeVisible();
  });

  it("shows a clear error for invalid credentials and clears the password", async () => {
    const user = userEvent.setup();
    authMocks.loginAdmin.mockRejectedValue(
      new AuthApiError("Backend login error.", 401),
    );
    renderApp();

    await user.click(screen.getByRole("button", { name: "ADMIN LOGIN" }));
    await user.type(screen.getByLabelText("Username"), "admin");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Log in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid username or password.",
    );
    expect(screen.getByLabelText("Password")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled();
  });

  it("restores a valid session and logout clears localStorage", async () => {
    const user = userEvent.setup();
    storeAuthSession(validSession());
    renderApp();

    const logoutButton = screen.getByRole("button", { name: "LOGOUT" });
    expect(screen.getByRole("button", { name: "+ ADD FILM" })).toBeVisible();
    await user.click(logoutButton);

    expect(localStorage).toHaveLength(0);
    expect(screen.getByRole("button", { name: "ADMIN LOGIN" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "+ ADD FILM" }))
      .not.toBeInTheDocument();
  });

  it("clears an expired stored token and remains outside admin mode", () => {
    localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, "expired-token");
    localStorage.setItem(
      AUTH_EXPIRY_STORAGE_KEY,
      new Date(Date.now() - 1_000).toISOString(),
    );

    renderApp();

    expect(localStorage).toHaveLength(0);
    expect(screen.getByRole("button", { name: "ADMIN LOGIN" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "+ ADD FILM" }))
      .not.toBeInTheDocument();
  });

  it("leaves admin mode and clears storage after a 401 invalidation", async () => {
    storeAuthSession(validSession());
    renderApp("/movies/7");
    await screen.findByRole("heading", { level: 1, name: catalogMovie.title });
    expect(screen.getByRole("button", { name: "Edit" })).toBeVisible();

    act(() => invalidateAuthSession("unauthorized"));

    expect(localStorage).toHaveLength(0);
    expect(screen.getByRole("button", { name: "ADMIN LOGIN" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("authorization failed");
  });
});

describe("Admin actor assignment", () => {
  beforeEach(resetApiMocks);

  it("loads actors only in admin mode and adds the selected actor to the cast", async () => {
    const user = userEvent.setup();
    const actorRequest = deferred<
      Array<{ id: number; name: string; birthYear: number; role: string }>
    >();
    const availableActor = {
      id: 11,
      name: "Takuya Kimura",
      birthYear: 1972,
      role: "",
    };
    const createdActor = { ...availableActor, role: "Howl" };
    apiMocks.getActors.mockReturnValue(actorRequest.promise);
    apiMocks.addMovieActor.mockResolvedValue(createdActor);
    renderApp("/movies/7");
    await screen.findByRole("heading", { level: 1, name: catalogMovie.title });
    await user.click(screen.getByRole("tab", { name: "Cast" }));

    expect(screen.queryByRole("heading", { name: "Add actor to cast" }))
      .not.toBeInTheDocument();
    expect(apiMocks.getActors).not.toHaveBeenCalled();

    await enterAdminMode(user);

    expect(screen.getByRole("heading", { name: "Add actor to cast" })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Loading actors");
    expect(apiMocks.getActors).toHaveBeenCalledWith(expect.any(AbortSignal));

    await act(() => actorRequest.resolve([availableActor]));
    await user.selectOptions(
      await screen.findByRole("combobox", { name: "Actor" }),
      "11",
    );
    await user.type(screen.getByLabelText("Role"), " Howl ");
    await user.click(screen.getByRole("button", { name: "Add actor" }));

    expect(apiMocks.addMovieActor).toHaveBeenCalledWith(7, 11, "Howl");
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Takuya Kimura was added to the cast as Howl.",
    );
    const cast = screen.getByRole("list", { name: "Cast" });
    expect(within(cast).getByText("Takuya Kimura")).toBeVisible();
    expect(within(cast).getByText("Howl")).toBeVisible();
  });

  it("shows validation and prevents duplicate submissions while saving", async () => {
    const user = userEvent.setup();
    const createdActor = {
      id: 11,
      name: "Takuya Kimura",
      birthYear: 1972,
      role: "Howl",
    };
    const actorRequest = deferred<typeof createdActor>();
    apiMocks.addMovieActor.mockReturnValue(actorRequest.promise);
    renderApp("/movies/7");
    await screen.findByRole("heading", { level: 1, name: catalogMovie.title });
    await enterAdminMode(user);
    await user.click(screen.getByRole("tab", { name: "Cast" }));
    await screen.findByRole("combobox", { name: "Actor" });

    await user.click(screen.getByRole("button", { name: "Add actor" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Select an actor.");
    expect(apiMocks.addMovieActor).not.toHaveBeenCalled();

    await user.selectOptions(screen.getByRole("combobox", { name: "Actor" }), "11");
    await user.type(screen.getByLabelText("Role"), "Howl");
    await user.click(screen.getByRole("button", { name: "Add actor" }));

    const submittingButton = screen.getByRole("button", { name: "Adding actor…" });
    expect(submittingButton).toBeDisabled();
    await user.click(submittingButton);
    expect(apiMocks.addMovieActor).toHaveBeenCalledOnce();

    await act(() => actorRequest.resolve(createdActor));
    expect(await screen.findByText(/was added to the cast as Howl/i)).toBeVisible();
  });

  it.each([
    [404, "The movie or selected actor could not be found. Refresh and try again."],
    [409, "This actor is already in the cast for this film."],
  ])("shows a clear %s assignment error", async (status, expectedMessage) => {
    const user = userEvent.setup();
    apiMocks.addMovieActor.mockRejectedValue(
      new MovieApiError("Backend actor error.", status),
    );
    renderApp("/movies/7");
    await screen.findByRole("heading", { level: 1, name: catalogMovie.title });
    await enterAdminMode(user);
    await user.click(screen.getByRole("tab", { name: "Cast" }));
    await user.selectOptions(
      await screen.findByRole("combobox", { name: "Actor" }),
      "11",
    );
    await user.type(screen.getByLabelText("Role"), "Howl");

    await user.click(screen.getByRole("button", { name: "Add actor" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(expectedMessage);
    expect(screen.getByRole("button", { name: "Add actor" })).toBeEnabled();
  });

  it("shows an accessible error when the actor list cannot be loaded", async () => {
    const user = userEvent.setup();
    apiMocks.getActors.mockRejectedValue(new Error("Actor service unavailable."));
    renderApp("/movies/7");
    await screen.findByRole("heading", { level: 1, name: catalogMovie.title });
    await enterAdminMode(user);
    await user.click(screen.getByRole("tab", { name: "Cast" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Actor service unavailable.",
    );
    expect(screen.queryByRole("combobox", { name: "Actor" })).not.toBeInTheDocument();
  });
});

describe("Catalog URL filters", () => {
  beforeEach(resetApiMocks);

  it("restores search and genre from the URL across back and forward navigation", async () => {
    const { router } = renderApp("/?search=castle&genre=Fantasy");

    expect(screen.getByRole("searchbox", { name: "Search films" })).toHaveValue(
      "castle",
    );
    expect(screen.getByRole("combobox", { name: "Filter by genre" })).toHaveValue(
      "Fantasy",
    );
    expect(apiMocks.getMovies).toHaveBeenCalledWith({
      signal: expect.any(AbortSignal),
      genre: "Fantasy",
      search: "castle",
    });

    await act(() => router.navigate("/?search=spirit&genre=Anime"));

    await waitFor(() => {
      expect(screen.getByRole("searchbox", { name: "Search films" })).toHaveValue(
        "spirit",
      );
      expect(screen.getByRole("combobox", { name: "Filter by genre" })).toHaveValue(
        "Anime",
      );
    });

    await act(() => router.navigate(-1));

    await waitFor(() => {
      expect(screen.getByRole("searchbox", { name: "Search films" })).toHaveValue(
        "castle",
      );
      expect(screen.getByRole("combobox", { name: "Filter by genre" })).toHaveValue(
        "Fantasy",
      );
    });

    await act(() => router.navigate(1));

    await waitFor(() => {
      expect(screen.getByRole("searchbox", { name: "Search films" })).toHaveValue(
        "spirit",
      );
      expect(screen.getByRole("combobox", { name: "Filter by genre" })).toHaveValue(
        "Anime",
      );
    });
  });

  it("debounces search URL updates by 300 ms and preserves other parameters", async () => {
    vi.useFakeTimers();

    try {
      const { router } = renderApp("/?source=archive");
      apiMocks.getMovies.mockClear();

      fireEvent.change(screen.getByRole("searchbox", { name: "Search films" }), {
        target: { value: "matrix" },
      });

      await act(() => vi.advanceTimersByTime(299));
      expect(new URLSearchParams(router.state.location.search).get("search")).toBeNull();
      expect(apiMocks.getMovies).not.toHaveBeenCalled();

      await act(() => vi.advanceTimersByTime(1));

      const currentParams = new URLSearchParams(router.state.location.search);
      expect(currentParams.get("search")).toBe("matrix");
      expect(currentParams.get("source")).toBe("archive");
      expect(apiMocks.getMovies).toHaveBeenCalledWith({
        signal: expect.any(AbortSignal),
        genre: undefined,
        search: "matrix",
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("aborts the previous catalog request when URL filters change", async () => {
    apiMocks.getMovies.mockImplementation(() => new Promise(() => {}));
    const { router } = renderApp();
    await waitFor(() => expect(apiMocks.getMovies).toHaveBeenCalledOnce());
    const firstSignal = apiMocks.getMovies.mock.calls[0][0].signal as AbortSignal;

    await act(() => router.navigate("/?genre=Fantasy"));

    expect(firstSignal.aborted).toBe(true);
    expect(apiMocks.getMovies).toHaveBeenCalledTimes(2);
    expect(apiMocks.getMovies.mock.calls[1][0]).toEqual({
      signal: expect.any(AbortSignal),
      genre: "Fantasy",
      search: undefined,
    });
  });
});

function resetApiMocks() {
  for (const apiMock of Object.values(apiMocks)) apiMock.mockReset();
  authMocks.loginAdmin.mockReset();
  localStorage.clear();
  sessionStorage.clear();
  apiMocks.getMovies.mockResolvedValue([catalogMovie]);
  apiMocks.getMovieDetails.mockResolvedValue(catalogDetail);
  apiMocks.getActors.mockResolvedValue([
    { id: 11, name: "Takuya Kimura", birthYear: 1972, role: "" },
  ]);
  authMocks.loginAdmin.mockResolvedValue(validSession());
}

function renderApp(initialEntry = "/") {
  const router = createMemoryRouter(
    [{ path: "*", element: <App /> }],
    { initialEntries: [initialEntry] },
  );

  return { ...render(<RouterProvider router={router} />), router };
}

async function findMovieLink() {
  return screen.findByRole("link", {
    name: `View details for ${catalogMovie.title}`,
  });
}

async function enterAdminMode(user: UserEvent) {
  await logInAsAdmin(
    user,
    screen.getByRole("button", { name: "ADMIN LOGIN" }),
  );
}

async function logInAsAdmin(user: UserEvent, loginButton: HTMLElement) {
  await user.click(loginButton);
  await user.type(screen.getByLabelText("Username"), "admin");
  await user.type(screen.getByLabelText("Password"), "secret");
  await user.click(screen.getByRole("button", { name: "Log in" }));
  await screen.findByRole("button", { name: "LOGOUT" });
}

function validSession() {
  return {
    token: "admin-token",
    expiresAtUtc: new Date(Date.now() + 60_000).toISOString(),
  };
}

async function fillCreateDialog(user: UserEvent) {
  await user.type(screen.getByLabelText("Title"), "Princess Mononoke");
  await user.type(screen.getByLabelText("Year"), "1997");
  await user.type(screen.getByLabelText("Duration (minutes)"), "134");
  await user.click(screen.getByRole("button", { name: /select genres/i }));
  await user.click(screen.getByRole("checkbox", { name: "Anime" }));
  await user.click(screen.getByRole("checkbox", { name: "Fantasy" }));
}
