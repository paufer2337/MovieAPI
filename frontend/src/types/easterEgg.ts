export type EasterEggVideoFormat = "portrait" | "landscape";

export type EasterEggPosition =
  | "top-left"
  | "top-right"
  | "middle-left"
  | "middle-right"
  | "lower-left"
  | "lower-right"
  | "poster-corner"
  | "metadata-corner";

export type EasterEggConfig = {
  id: string;
  assetPath: string;
  videoId: string;
  originalUrl: string;
  format: EasterEggVideoFormat;
  movieTitle: string;
  position: EasterEggPosition;
  accessibleName: string;
};
