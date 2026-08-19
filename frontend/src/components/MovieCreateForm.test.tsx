import { render, screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MovieCreateForm } from "./MovieCreateForm";
import { deferred, makeMovie } from "../test/fixtures";

const apiMocks = vi.hoisted(() => ({
  createMovie: vi.fn(),
}));

vi.mock("../services/movieApi", () => ({
  createMovie: apiMocks.createMovie,
}));

describe("MovieCreateForm", () => {
  beforeEach(() => {
    apiMocks.createMovie.mockReset();
  });

  it("shows field-specific, programmatically associated validation errors", async () => {
    const user = userEvent.setup();
    render(<MovieCreateForm onCreated={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Add film" }));

    const title = screen.getByLabelText("Title");
    const year = screen.getByLabelText("Year");
    const genreTrigger = screen.getByRole("button", { name: /select genres/i });
    const duration = screen.getByLabelText("Duration (minutes)");

    expect(title).toHaveAttribute("aria-invalid", "true");
    expect(title).toHaveAccessibleDescription(
      "Title must be between 2 and 120 characters.",
    );
    expect(year).toHaveAttribute("aria-invalid", "true");
    expect(year).toHaveAccessibleDescription(
      "Year must be a whole number between 1888 and 2100.",
    );
    expect(genreTrigger).toHaveAttribute("aria-invalid", "true");
    expect(genreTrigger).toHaveAccessibleDescription(
      "Select at least one genre.",
    );
    expect(duration).toHaveAttribute("aria-invalid", "true");
    expect(duration).toHaveAccessibleDescription(
      "Duration must be a whole number between 1 and 600 minutes.",
    );
    expect(apiMocks.createMovie).not.toHaveBeenCalled();
  });

  it("submits a normalized payload with at least one selected genre", async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();
    const created = makeMovie({
      id: 14,
      title: "Princess Mononoke",
      year: 1997,
      genre: "Anime/Fantasy",
      duration: 134,
    });
    apiMocks.createMovie.mockResolvedValue(created);
    render(<MovieCreateForm onCreated={onCreated} />);

    await fillValidForm(user, {
      title: "  Princess Mononoke  ",
      year: "1997",
      duration: "134",
      genres: ["Anime", "Fantasy"],
    });
    await user.click(screen.getByRole("button", { name: "Add film" }));

    await waitFor(() => {
      expect(apiMocks.createMovie).toHaveBeenCalledWith({
        title: "Princess Mononoke",
        year: 1997,
        genre: "Anime/Fantasy",
        duration: 134,
      });
    });
    expect(onCreated).toHaveBeenCalledWith(created);
    expect(screen.getByLabelText("Title")).toHaveValue("");
  });

  it("shows a loading state and prevents duplicate submissions", async () => {
    const user = userEvent.setup();
    const pendingCreation = deferred<ReturnType<typeof makeMovie>>();
    const created = makeMovie({ id: 22 });
    const onCreated = vi.fn();
    apiMocks.createMovie.mockReturnValue(pendingCreation.promise);
    render(<MovieCreateForm onCreated={onCreated} />);
    await fillValidForm(user);

    const submitButton = screen.getByRole("button", { name: "Add film" });
    await user.click(submitButton);

    const savingButton = screen.getByRole("button", { name: "Saving film…" });
    expect(savingButton).toBeDisabled();
    await user.click(savingButton);
    expect(apiMocks.createMovie).toHaveBeenCalledTimes(1);

    pendingCreation.resolve(created);
    await waitFor(() => expect(onCreated).toHaveBeenCalledWith(created));
  });

  it("announces an API error and preserves entered values", async () => {
    const user = userEvent.setup();
    apiMocks.createMovie.mockRejectedValue(new Error("The API is unavailable."));
    render(<MovieCreateForm onCreated={vi.fn()} />);
    await fillValidForm(user, { title: "Wolf Children" });

    await user.click(screen.getByRole("button", { name: "Add film" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The API is unavailable.",
    );
    expect(screen.getByLabelText("Title")).toHaveValue("Wolf Children");
    expect(screen.getByRole("button", { name: "Add film" })).toBeEnabled();
  });
});

type ValidFormValues = {
  title: string;
  year: string;
  duration: string;
  genres: string[];
};

async function fillValidForm(
  user: UserEvent,
  overrides: Partial<ValidFormValues> = {},
) {
  const values: ValidFormValues = {
    title: "Spirited Away",
    year: "2001",
    duration: "125",
    genres: ["Anime"],
    ...overrides,
  };

  await user.type(screen.getByLabelText("Title"), values.title);
  await user.type(screen.getByLabelText("Year"), values.year);
  await user.type(screen.getByLabelText("Duration (minutes)"), values.duration);
  await user.click(screen.getByRole("button", { name: /select genres/i }));

  for (const genre of values.genres) {
    await user.click(screen.getByRole("checkbox", { name: genre }));
  }
}
