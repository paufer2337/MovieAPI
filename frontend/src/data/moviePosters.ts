const moviePosters: Record<string, string> = {
  Inception: "/posters/inception.webp",
  "The Matrix": "/posters/the-matrix.webp",
  Braveheart: "/posters/braveheart.webp",
  Gladiator: "/posters/gladiator.webp",
  Troy: "/posters/troy.webp",
  Titanic: "/posters/titanic.webp",
  Avatar: "/posters/avatar.webp",
  "Hachi: A Dog's Tale": "/posters/hachi.webp",
  "The Pursuit of Happyness":
    "/posters/pursuit-of-happyness.webp",
  "Black Beauty": "/posters/black-beauty.webp",
};

export function getMoviePoster(
  movieTitle: string,
): string | undefined {
  return moviePosters[movieTitle];
}