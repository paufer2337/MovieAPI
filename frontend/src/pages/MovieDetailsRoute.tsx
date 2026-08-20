import { useParams } from "react-router-dom";
import { MovieDetailsPage } from "../components/MovieModal";
import { RouteMessagePage } from "./RouteMessagePage";

export function MovieDetailsRoute({ isAdminMode }: { isAdminMode: boolean }) {
  const { id } = useParams();
  const movieId = id && /^\d+$/.test(id) ? Number(id) : Number.NaN;
  const isValidId = Number.isSafeInteger(movieId) && movieId > 0;

  if (!isValidId) {
    return (
      <RouteMessagePage
        title="Invalid movie"
        message="The movie address must contain a valid positive number."
      />
    );
  }

  return <MovieDetailsPage movieId={movieId} isAdminMode={isAdminMode} />;
}
