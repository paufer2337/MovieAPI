import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardPage } from "./DashboardPage";
import { runAxe } from "../test/axe";

describe("DashboardPage", () => {
  beforeEach(() => vi.stubEnv("VITE_API_URL", "https://movies.example.test/api/Movies"));

  it("loads all reports and renders accessible tables", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const path = new URL(String(input)).pathname;
      if (path.endsWith("top-movies-by-genre")) return jsonResponse([{ genre: "Drama", movies: [{ rank: 1, movieId: 7, title: "Archive Film", averageRating: 4.5, reviewCount: 2 }] }]);
      if (path.endsWith("average-ratings")) return jsonResponse([{ movieId: 7, title: "Archive Film", averageRating: 4.5, reviewCount: 2 }]);
      return jsonResponse([{ rank: 1, actorId: 11, name: "Archive Actor", movieCount: 3 }]);
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<MemoryRouter><DashboardPage /></MemoryRouter>);

    const topTable = await screen.findByRole("table", { name: "Top 5 films by genre" });
    expect(within(topTable).getByText("Archive Film")).toBeVisible();
    expect(screen.getByRole("table", { name: "Average rating per film" })).toBeVisible();
    expect(screen.getByRole("table", { name: "Most active actors" })).toHaveTextContent("Archive Actor");
    expect(fetchMock.mock.calls.map(([input]) => String(input))).toEqual([
      "https://movies.example.test/api/reports/top-movies-by-genre",
      "https://movies.example.test/api/reports/average-ratings",
      "https://movies.example.test/api/reports/most-active-actors",
    ]);
    expect((await runAxe(document.body)).violations).toEqual([]);
  });
});

function jsonResponse(body: unknown): Response {
  return { ok: true, status: 200, json: async () => structuredClone(body) } as Response;
}
