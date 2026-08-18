import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { MovieApiError } from "./services/movieApi";
import { runAxe } from "./test/axe";
import { makeMovie, makeMovieDetail } from "./test/fixtures";

const apiMocks = vi.hoisted(() => ({
  createMovie: vi.fn(),
  createReview: vi.fn(),
  deleteMovie: vi.fn(),
  getMovieDetails: vi.fn(),
  getMovies: vi.fn(),
  updateMovie: vi.fn(),
}));

vi.mock("./services/movieApi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./services/movieApi")>()),
  ...apiMocks,
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

    const adminButton = screen.getByRole("button", { name: "ADMIN MODE" });
    expect(adminButton).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("button", { name: "+ ADD FILM" })).not.toBeInTheDocument();

    await user.click(await findMovieLink());
    await screen.findByRole("heading", { level: 1, name: catalogMovie.title });
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();

    await user.click(adminButton);

    expect(screen.getByRole("button", { name: "EXIT ADMIN MODE" })).toHaveAttribute(
      "aria-pressed",
      "true",
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

describe("App routing and movie details", () => {
  beforeEach(resetApiMocks);

  it("renders the catalog with real movie links and catalog page metadata", async () => {
    renderApp();

    const heading = screen.getByRole("heading", { level: 1, name: /the infinite\s*archive/i });
    expect(heading).toHaveFocus();
    expect(document.title).toBe("The Infinite Archive | CinematheQue");
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
      await screen.findByRole("heading", { level: 1, name: /the infinite\s*archive/i }),
    ).toBeInTheDocument();
  });

  it("returns to the catalog through the back link and focuses its h1", async () => {
    const user = userEvent.setup();
    renderApp("/movies/7");
    await screen.findByRole("heading", { level: 1, name: catalogMovie.title });

    await user.click(screen.getByRole("link", { name: /back to the catalog/i }));

    const catalogHeading = await screen.findByRole("heading", {
      level: 1,
      name: /the infinite\s*archive/i,
    });
    expect(catalogHeading).toHaveFocus();
    expect(document.title).toBe("The Infinite Archive | CinematheQue");
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

function resetApiMocks() {
  for (const apiMock of Object.values(apiMocks)) apiMock.mockReset();
  apiMocks.getMovies.mockResolvedValue([catalogMovie]);
  apiMocks.getMovieDetails.mockResolvedValue(catalogDetail);
}

function renderApp(initialEntry = "/") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>,
  );
}

async function findMovieLink() {
  return screen.findByRole("link", {
    name: `View details for ${catalogMovie.title}`,
  });
}

async function enterAdminMode(user: UserEvent) {
  await user.click(screen.getByRole("button", { name: "ADMIN MODE" }));
}

async function fillCreateDialog(user: UserEvent) {
  await user.type(screen.getByLabelText("Title"), "Princess Mononoke");
  await user.type(screen.getByLabelText("Year"), "1997");
  await user.type(screen.getByLabelText("Duration (minutes)"), "134");
  await user.click(screen.getByRole("button", { name: /select genres/i }));
  await user.click(screen.getByRole("checkbox", { name: "Anime" }));
  await user.click(screen.getByRole("checkbox", { name: "Fantasy" }));
}
