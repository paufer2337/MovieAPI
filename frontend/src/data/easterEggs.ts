import type { EasterEggConfig } from "../types/easterEgg";

// Seed IDs depend on the database's existing identity values, while these exact
// titles are stable in every demo catalog. Title matching is therefore deliberate.
export const EASTER_EGGS = [
  {
    id: "egg-01",
    assetPath: "/images/easter-eggs/egg-01.png",
    videoId: "_6HzLIJPH2A",
    originalUrl: "https://youtube.com/shorts/_6HzLIJPH2A?si=J_mWQDLMoHZGeRBM",
    format: "portrait",
    movieTitle: "Inception",
    position: "top-left",
    accessibleName: "Hidden Easter egg",
  },
  {
    id: "egg-02",
    assetPath: "/images/easter-eggs/egg-02.png",
    videoId: "vKiDhuA6VKo",
    originalUrl: "https://www.youtube.com/shorts/vKiDhuA6VKo",
    format: "portrait",
    movieTitle: "The Matrix",
    position: "top-right",
    accessibleName: "Hidden Easter egg",
  },
  {
    id: "egg-03",
    assetPath: "/images/easter-eggs/egg-03.png",
    videoId: "9vbAoflNPO0",
    originalUrl: "https://youtube.com/shorts/9vbAoflNPO0?si=tBD2LrY52PSNIc7T",
    format: "portrait",
    movieTitle: "Braveheart",
    position: "middle-left",
    accessibleName: "Hidden Easter egg",
  },
  {
    id: "egg-04",
    assetPath: "/images/easter-eggs/egg-04.png",
    videoId: "jf50w-wkPoA",
    originalUrl: "https://youtube.com/shorts/jf50w-wkPoA?si=gf0qtSHCpDiypXGu",
    format: "portrait",
    movieTitle: "Gladiator",
    position: "middle-right",
    accessibleName: "Hidden Easter egg",
  },
  {
    id: "egg-05",
    assetPath: "/images/easter-eggs/egg-05.png",
    videoId: "582H20VnvZs",
    originalUrl: "https://youtube.com/shorts/582H20VnvZs?si=7mueRpsqTJw4Vu1r",
    format: "portrait",
    movieTitle: "Titanic",
    position: "lower-left",
    accessibleName: "Hidden Easter egg",
  },
  {
    id: "egg-06",
    assetPath: "/images/easter-eggs/egg-06.png",
    videoId: "3rZQjgdIv4Y",
    originalUrl: "https://youtube.com/shorts/3rZQjgdIv4Y?si=KbuD0HtAnLmXJFPB",
    format: "portrait",
    movieTitle: "Avatar",
    position: "lower-right",
    accessibleName: "Hidden Easter egg",
  },
  {
    id: "egg-07",
    assetPath: "/images/easter-eggs/egg-07.png",
    videoId: "svOg6O3QC7w",
    originalUrl: "https://youtube.com/shorts/svOg6O3QC7w?si=kitg5NW57fYJiEEg",
    format: "portrait",
    movieTitle: "Princess Mononoke",
    position: "poster-corner",
    accessibleName: "Hidden Easter egg",
  },
  {
    id: "egg-08",
    assetPath: "/images/easter-eggs/egg-08.png",
    videoId: "I-h-kdscGH8",
    originalUrl:
      "https://www.youtube.com/watch?v=I-h-kdscGH8&list=RDI-h-kdscGH8&start_radio=1",
    format: "landscape",
    movieTitle: "Spirited Away",
    position: "metadata-corner",
    accessibleName: "Hidden Easter egg",
  },
] as const satisfies readonly EasterEggConfig[];

export function getEasterEggForMovie(
  movieTitle: string,
): EasterEggConfig | undefined {
  const normalizedTitle = movieTitle.trim().toLocaleLowerCase("en-US");
  return EASTER_EGGS.find(
    (egg) => egg.movieTitle.toLocaleLowerCase("en-US") === normalizedTitle,
  );
}
