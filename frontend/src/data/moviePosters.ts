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
  "The Last Samurai": "/posters/the-last-samurai.webp",
  "The Call of the Wild": "/posters/the-call-of-the-wild.webp",
  "Shutter Island": "/posters/shutter-island.webp",
  "Spirit: Stallion of the Cimarron": "/posters/spirit.webp",
  "Brother Bear": "/posters/brother-bear.webp",
  "The Lion King": "/posters/the-lion-king.webp",
  "Free Willy": "/posters/free-willy.webp",
  "The Lord of the Rings: The Fellowship of the Ring":
    "/posters/the-lord-of-the-rings-i.webp",
  "The Lord of the Rings: The Two Towers":
    "/posters/the-lord-of-the-rings-ii.webp",
  "The Lord of the Rings: The Return of the King":
    "/posters/the-lord-of-the-rings-iii.webp",
  "The Hobbit: An Unexpected Journey": "/posters/hobbit-i.webp",
  "The Hobbit: The Desolation of Smaug": "/posters/hobbit-ii.webp",
  "The Hobbit: The Battle of the Five Armies":
    "/posters/hobbit-iii.webp",
};

export function getMoviePoster(
  movieTitle: string,
): string | undefined {
  return moviePosters[movieTitle];
}
