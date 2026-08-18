export const CANONICAL_GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Anime",
  "Biography",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Musical",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Sport",
  "Thriller",
  "War",
  "Western",
] as const;

const canonicalGenreLookup = new Map(
  CANONICAL_GENRES.map((genre) => [genre.toLocaleLowerCase(), genre]),
);

export function parseGenres(value: string): string[] {
  const genres: string[] = [];
  const seen = new Set<string>();

  for (const part of value.split(/[/,]/)) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const comparisonKey = trimmed.toLocaleLowerCase();
    if (seen.has(comparisonKey)) continue;

    seen.add(comparisonKey);
    genres.push(canonicalGenreLookup.get(comparisonKey) ?? trimmed);
  }

  return genres;
}

export function serializeGenres(genres: readonly string[]): string {
  return parseGenres(genres.join("/")).join("/");
}

export function getPrimaryGenre(value: string): string {
  const genres = parseGenres(value);
  return genres.find((genre) => genre === "Anime") ?? genres[0] ?? "Uncategorized";
}

export function formatGenres(value: string): string {
  return parseGenres(value).join(" · ");
}
