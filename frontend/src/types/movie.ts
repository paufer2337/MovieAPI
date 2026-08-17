export type Movie = {
  id: number;
  title: string;
  year: number;
  genre: string;
  duration: number;
};

export type MovieDetails = {
  synopsis: string;
  language: string;
  budget: number;
};

export type Review = {
  id: number;
  reviewerName: string;
  comment: string;
  rating: number;
};

export type Actor = {
  id: number;
  name: string;
  birthYear: number;
  role: string;
};

export type MovieDetail = Movie & {
  details: MovieDetails | null;
  reviews: Review[];
  actors: Actor[];
};

export type MovieInput = Omit<Movie, "id">;

export type ReviewInput = {
  reviewerName: string;
  comment: string;
  rating: number;
};
