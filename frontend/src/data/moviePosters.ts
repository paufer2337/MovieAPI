const moviePosters: Record<number, string> = {
  1: "/posters/inception.webp",
  2: "/posters/the-matrix.webp",
  3: "/posters/braveheart.webp",
  4: "/posters/gladiator.webp",
  5: "/posters/troy.webp",
  6: "/posters/titanic.webp",
  7: "/posters/avatar.webp",
  8: "/posters/hachi.webp",
  9: "/posters/pursuit-of-happyness.webp",
  10: "/posters/black-beauty.webp",
};

export function getMoviePoster(movieId: number): string | undefined {
  return moviePosters[movieId];
}