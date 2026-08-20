import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { EASTER_EGGS } from "../../data/easterEggs";
import { HiddenEasterEgg, MovieEasterEgg } from "./HiddenEasterEgg";

const firstEgg = EASTER_EGGS[0];

describe("MovieEasterEgg", () => {
  it("shows the configured egg on its film and no egg on another film", () => {
    const { rerender } = render(<MovieEasterEgg movieTitle="Inception" />);

    expect(screen.getByRole("button", { name: "Hidden Easter egg" }))
      .toHaveClass("hidden-easter-egg--top-left");
    expect(screen.getByRole("presentation")).toHaveAttribute(
      "src",
      firstEgg.assetPath,
    );

    rerender(<MovieEasterEgg movieTitle="Unconfigured Film" />);
    expect(screen.queryByRole("button", { name: "Hidden Easter egg" }))
      .not.toBeInTheDocument();
  });
});

describe("HiddenEasterEgg", () => {
  it("opens the correct privacy-enhanced video exactly on click three", async () => {
    const user = userEvent.setup();
    render(<HiddenEasterEgg egg={firstEgg} />);
    const button = screen.getByRole("button", { name: "Hidden Easter egg" });

    await user.click(button);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(button);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(button);

    const dialog = screen.getByRole("dialog", {
      name: "Easter egg video for Inception",
    });
    const iframe = screen.getByTitle("Easter egg video for Inception");
    expect(dialog).toHaveAttribute("open");
    expect(iframe).toHaveAttribute(
      "src",
      expect.stringContaining("youtube-nocookie.com/embed/_6HzLIJPH2A"),
    );
    expect(screen.getByRole("button", { name: "Close Easter egg video" }))
      .toHaveFocus();
  });

  it("closes with the button, removes the iframe and restores focus", async () => {
    const user = userEvent.setup();
    render(<HiddenEasterEgg egg={firstEgg} />);
    const eggButton = screen.getByRole("button", { name: "Hidden Easter egg" });
    await revealWithClicks(user, eggButton);

    await user.click(
      screen.getByRole("button", { name: "Close Easter egg video" }),
    );

    expect(screen.queryByTitle("Easter egg video for Inception"))
      .not.toBeInTheDocument();
    await waitFor(() => expect(eggButton).toHaveFocus());
  });

  it("closes through the native Escape cancel event", async () => {
    const user = userEvent.setup();
    render(<HiddenEasterEgg egg={firstEgg} />);
    const eggButton = screen.getByRole("button", { name: "Hidden Easter egg" });
    await revealWithClicks(user, eggButton);
    const dialog = screen.getByRole("dialog");

    fireEvent(dialog, new Event("cancel", { cancelable: true }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(eggButton).toHaveFocus());
  });

  it("closes when the native dialog backdrop is clicked", async () => {
    const user = userEvent.setup();
    render(<HiddenEasterEgg egg={firstEgg} />);
    await revealWithClicks(
      user,
      screen.getByRole("button", { name: "Hidden Easter egg" }),
    );

    fireEvent.click(screen.getByRole("dialog"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("counts keyboard activation and resets after a reveal", async () => {
    const user = userEvent.setup();
    render(<HiddenEasterEgg egg={firstEgg} />);
    const eggButton = screen.getByRole("button", { name: "Hidden Easter egg" });
    eggButton.focus();

    await user.keyboard("[Space]");
    await user.keyboard("[Space]");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.keyboard("[Space]");
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Close Easter egg video" }),
    );
    await waitFor(() => expect(eggButton).toHaveFocus());
    await user.keyboard("[Enter]");
    await user.keyboard("[Enter]");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.keyboard("[Enter]");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

async function revealWithClicks(
  user: ReturnType<typeof userEvent.setup>,
  button: HTMLElement,
) {
  await user.click(button);
  await user.click(button);
  await user.click(button);
}
