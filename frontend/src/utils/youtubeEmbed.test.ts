import { describe, expect, it } from "vitest";
import { buildYouTubeEmbedUrl } from "./youtubeEmbed";

describe("buildYouTubeEmbedUrl", () => {
  it("builds a privacy-enhanced looping autoplay URL from a video ID", () => {
    const url = new URL(buildYouTubeEmbedUrl("_6HzLIJPH2A"));

    expect(url.origin).toBe("https://www.youtube-nocookie.com");
    expect(url.pathname).toBe("/embed/_6HzLIJPH2A");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      autoplay: "1",
      playsinline: "1",
      rel: "0",
      loop: "1",
      playlist: "_6HzLIJPH2A",
    });
  });

  it("rejects anything other than a clean YouTube video ID", () => {
    expect(() => buildYouTubeEmbedUrl("video?id=unsafe")).toThrow(
      "Invalid YouTube video ID",
    );
  });
});
