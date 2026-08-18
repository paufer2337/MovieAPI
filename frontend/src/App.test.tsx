import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
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

vi.mock("./services/movieApi", () => apiMocks);

describe("App administration and dialogs", () => {
  const catalogMovie = makeMovie({
    id: 7,
    title: "Howl's Moving Castle",
    genre: "Fantasy/Anime/Adventure",
    year: 2004,
    duration: 119,
  });
  const catalogDetail = makeMovieDetail({
    ...catalogMovie,
    genre: "Fantasy/Anime/Adventure",
  });

  beforeEach(() => {
    for (const apiMock of Object.values(apiMocks)) apiMock.mockReset();
    apiMocks.getMovies.mockResolvedValue([catalogMovie]);
    apiMocks.getMovieDetails.mockResolvedValue(catalogDetail);
  });

  it("starts in user mode and exposes mutation controls only in admin mode", async () => {
    const user = userEvent.setup();
    render(<App />);

    const adminButton = screen.getByRole("button", { name: "ADMIN MODE" });
    expect(adminButton).toHaveAttribute("aria-pressed", "false");
    expect(screen.queryByRole("button", { name: "+ ADD FILM" })).not.toBeInTheDocument();

    await user.click(await findMovieTrigger());
    await screen.findByRole("heading", {
      level: 2,
      name: catalogMovie.title,
    });
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Delete" })).not.toBeInTheDocument();

    await user.click(adminButton);

    expect(
      screen.getByRole("button", { name: "EXIT ADMIN MODE" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "+ ADD FILM" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Edit" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Delete" })).toBeVisible();
  });

  it("opens an accessibly named create dialog and restores focus on Cancel", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: catalogMovie.title });
    await enterAdminMode(user);
    const addButton = screen.getByRole("button", { name: "+ ADD FILM" });

    await user.click(addButton);

    const dialog = screen.getByRole("dialog", { name: "Add a film" });
    expect(dialog).toHaveAttribute("open");
    expect(screen.getByLabelText("Title")).toHaveFocus();
    const axeResult = await runAxe(dialog);
    expect(axeResult.violations).toEqual([]);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog", { name: "Add a film" })).not.toBeInTheDocument();
    await waitFor(() => expect(addButton).toHaveFocus());
  });

  it("handles the dialog cancel event used by Escape and restores focus", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: catalogMovie.title });
    await enterAdminMode(user);
    const addButton = screen.getByRole("button", { name: "+ ADD FILM" });
    await user.click(addButton);
    const dialog = screen.getByRole("dialog", { name: "Add a film" });

    fireEvent(dialog, new Event("cancel", { cancelable: true }));

    expect(screen.queryByRole("dialog", { name: "Add a film" })).not.toBeInTheDocument();
    await waitFor(() => expect(addButton).toHaveFocus());
  });

  it("closes from the accessibly named close button and restores focus", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: catalogMovie.title });
    await enterAdminMode(user);
    const addButton = screen.getByRole("button", { name: "+ ADD FILM" });
    await user.click(addButton);

    await user.click(
      screen.getByRole("button", { name: "Close add film dialog" }),
    );

    expect(screen.queryByRole("dialog", { name: "Add a film" })).not.toBeInTheDocument();
    await waitFor(() => expect(addButton).toHaveFocus());
  });

  it("adds a created movie, announces success, closes, and restores focus", async () => {
    const user = userEvent.setup();
    const created = makeMovie({
      id: 99,
      title: "Princess Mononoke",
      year: 1997,
      genre: "Anime/Fantasy",
      duration: 134,
    });
    apiMocks.createMovie.mockResolvedValue(created);
    render(<App />);
    await screen.findByRole("heading", { name: catalogMovie.title });
    await enterAdminMode(user);
    const addButton = screen.getByRole("button", { name: "+ ADD FILM" });
    await user.click(addButton);
    await fillCreateDialog(user);

    await user.click(screen.getByRole("button", { name: "Add film" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "“Princess Mononoke” was added to the archive.",
    );
    expect(
      screen.getByRole("heading", { name: "Princess Mononoke" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Add a film" })).not.toBeInTheDocument();
    await waitFor(() => expect(addButton).toHaveFocus());
  });
});

describe("App movie details panel", () => {
  it("shows every genre and restores focus to the selected movie on close", async () => {
    const user = userEvent.setup();
    const movie = makeMovie({
      id: 8,
      title: "My Neighbor Totoro",
      genre: "Family/Anime/Fantasy",
    });
    apiMocks.getMovies.mockReset().mockResolvedValue([movie]);
    apiMocks.getMovieDetails
      .mockReset()
      .mockResolvedValue(makeMovieDetail({ ...movie }));
    render(<App />);
    const trigger = await screen.findByRole("button", {
      name: `View details for ${movie.title}`,
    });

    await user.click(trigger);

    const title = await screen.findByRole("heading", {
      level: 2,
      name: movie.title,
    });
    expect(screen.getByText("Family · Anime · Fantasy")).toBeInTheDocument();
    expect(title).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Close movie details" }));

    expect(
      screen.queryByRole("heading", { level: 2, name: movie.title }),
    ).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});

async function findMovieTrigger() {
  return screen.findByRole("button", {
    name: "View details for Howl's Moving Castle",
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
