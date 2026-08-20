const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function buildYouTubeEmbedUrl(videoId: string): string {
  if (!YOUTUBE_VIDEO_ID.test(videoId)) {
    throw new Error("Invalid YouTube video ID in Easter egg configuration.");
  }

  const url = new URL(
    `/embed/${encodeURIComponent(videoId)}`,
    "https://www.youtube-nocookie.com",
  );
  url.searchParams.set("autoplay", "1");
  url.searchParams.set("playsinline", "1");
  url.searchParams.set("rel", "0");
  url.searchParams.set("loop", "1");
  url.searchParams.set("playlist", videoId);
  return url.toString();
}
