import { describe, expect, it } from "vitest";
import { EASTER_EGGS, getEasterEggForMovie } from "./easterEggs";

describe("Easter egg configuration", () => {
  it("contains exactly eight unique eggs, films, assets and video IDs", () => {
    expect(EASTER_EGGS).toHaveLength(8);
    expect(new Set(EASTER_EGGS.map((egg) => egg.id))).toHaveLength(8);
    expect(new Set(EASTER_EGGS.map((egg) => egg.movieTitle))).toHaveLength(8);
    expect(new Set(EASTER_EGGS.map((egg) => egg.assetPath))).toHaveLength(8);
    expect(new Set(EASTER_EGGS.map((egg) => egg.videoId))).toHaveLength(8);
    expect(new Set(EASTER_EGGS.map((egg) => egg.position))).toHaveLength(8);
  });

  it("uses landscape format only for video 8", () => {
    expect(EASTER_EGGS.map((egg) => egg.format)).toEqual([
      "portrait",
      "portrait",
      "portrait",
      "portrait",
      "portrait",
      "portrait",
      "portrait",
      "landscape",
    ]);
    expect(EASTER_EGGS[7].videoId).toBe("I-h-kdscGH8");
  });

  it("maps the right egg by stable exact seed title and no egg to other films", () => {
    expect(getEasterEggForMovie("  Inception ")?.id).toBe("egg-01");
    expect(getEasterEggForMovie("The Matrix")?.id).toBe("egg-02");
    expect(getEasterEggForMovie("A Film Outside The Seed Catalog")).toBeUndefined();
  });
});
