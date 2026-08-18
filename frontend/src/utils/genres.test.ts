import { describe, expect, it } from "vitest";
import {
  formatGenres,
  getPrimaryGenre,
  parseGenres,
  serializeGenres,
} from "./genres";

describe("genre utilities", () => {
  it("parses slash- and comma-separated genres", () => {
    expect(parseGenres("Drama / Fantasy,Anime")).toEqual([
      "Drama",
      "Fantasy",
      "Anime",
    ]);
  });

  it("normalizes canonical genres and preserves unknown genres", () => {
    expect(parseGenres(" action / SCI-FI / Nordic Noir ")).toEqual([
      "Action",
      "Sci-Fi",
      "Nordic Noir",
    ]);
  });

  it("deduplicates genres case-insensitively in first-seen order", () => {
    expect(parseGenres("anime/Drama/ANIME/drama/Fantasy")).toEqual([
      "Anime",
      "Drama",
      "Fantasy",
    ]);
  });

  it("serializes a normalized, deduplicated genre list", () => {
    expect(serializeGenres([" drama ", "Anime", "DRAMA", "Fantasy"])).toBe(
      "Drama/Anime/Fantasy",
    );
    expect(formatGenres("Drama/Anime/Fantasy")).toBe(
      "Drama · Anime · Fantasy",
    );
  });

  it("prefers Anime as the primary genre", () => {
    expect(getPrimaryGenre("Fantasy/Anime/Drama")).toBe("Anime");
    expect(getPrimaryGenre(" ")).toBe("Uncategorized");
  });
});
