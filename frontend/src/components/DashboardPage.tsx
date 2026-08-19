import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  getDashboardReports,
  type DashboardReports,
} from "../services/reportsApi";

export function DashboardPage() {
  const [reports, setReports] = useState<DashboardReports | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = "Dashboard | CinematheQue";
    headingRef.current?.focus();
    const controller = new AbortController();

    getDashboardReports(controller.signal)
      .then(setReports)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setErrorMessage(error instanceof Error ? error.message : "Could not load reports.");
      });

    return () => controller.abort();
  }, []);

  return (
    <main className="dashboard-page">
      <Link className="dashboard-back" to="/">← Back to the catalog</Link>
      <h1 ref={headingRef} tabIndex={-1}>Archive dashboard</h1>

      {!reports && !errorMessage && <p role="status">Loading reports…</p>}
      {errorMessage && <p role="alert">{errorMessage}</p>}

      {reports && (
        <div className="dashboard-reports">
          <ReportTable title="Top 5 films by genre" isEmpty={reports.topMoviesByGenre.length === 0}>
            <thead><tr><th scope="col">Genre</th><th scope="col">Rank</th><th scope="col">Film</th><th scope="col">Average rating</th><th scope="col">Reviews</th></tr></thead>
            <tbody>
              {reports.topMoviesByGenre.flatMap((group) =>
                group.movies.map((movie) => (
                  <tr key={`${group.genre}-${movie.movieId}`}><th scope="row">{group.genre}</th><td>{movie.rank}</td><td>{movie.title}</td><td>{formatRating(movie.averageRating)}</td><td>{movie.reviewCount}</td></tr>
                )),
              )}
            </tbody>
          </ReportTable>

          <ReportTable title="Average rating per film" isEmpty={reports.averageRatings.length === 0}>
            <thead><tr><th scope="col">Film</th><th scope="col">Average rating</th><th scope="col">Reviews</th></tr></thead>
            <tbody>
              {reports.averageRatings.map((movie) => (
                <tr key={movie.movieId}><th scope="row">{movie.title}</th><td>{formatRating(movie.averageRating)}</td><td>{movie.reviewCount}</td></tr>
              ))}
            </tbody>
          </ReportTable>

          <ReportTable title="Most active actors" isEmpty={reports.mostActiveActors.length === 0}>
            <thead><tr><th scope="col">Rank</th><th scope="col">Actor</th><th scope="col">Films</th></tr></thead>
            <tbody>
              {reports.mostActiveActors.map((actor) => (
                <tr key={actor.actorId}><td>{actor.rank}</td><th scope="row">{actor.name}</th><td>{actor.movieCount}</td></tr>
              ))}
            </tbody>
          </ReportTable>
        </div>
      )}
    </main>
  );
}

function ReportTable({
  title,
  isEmpty,
  children,
}: {
  title: string;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="dashboard-report">
      <h2>{title}</h2>
      {isEmpty ? <p>No report data available.</p> : <div className="dashboard-table-wrap"><table><caption>{title}</caption>{children}</table></div>}
    </section>
  );
}

function formatRating(rating: number | null): string {
  return rating === null ? "No reviews" : rating.toFixed(2);
}
