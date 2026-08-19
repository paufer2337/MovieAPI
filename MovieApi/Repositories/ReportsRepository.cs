using Microsoft.EntityFrameworkCore;
using MovieApi.Data;

namespace MovieApi.Repositories;

public sealed class ReportsRepository : IReportsRepository
{
    private readonly MovieContext _context;

    public ReportsRepository(MovieContext context) => _context = context;

    public Task<List<MovieRatingReportRow>> GetMovieRatingsAsync() =>
        _context.Movies
            .AsNoTracking()
            .OrderBy(movie => movie.Title)
            .ThenBy(movie => movie.Id)
            .Select(movie => new MovieRatingReportRow(
                movie.Id,
                movie.Title,
                movie.Genre,
                movie.Reviews
                    .Select(review => (double?)review.Rating)
                    .Average(),
                movie.Reviews.Count))
            .ToListAsync();

    public Task<List<ActorActivityReportRow>> GetActorActivityAsync() =>
        _context.Actors
            .AsNoTracking()
            .Select(actor => new
            {
                ActorId = actor.Id,
                actor.Name,
                MovieCount = actor.MovieActors.Count
            })
            .OrderByDescending(actor => actor.MovieCount)
            .ThenBy(actor => actor.Name)
            .ThenBy(actor => actor.ActorId)
            .Select(actor => new ActorActivityReportRow(
                actor.ActorId,
                actor.Name,
                actor.MovieCount))
            .ToListAsync();
}
