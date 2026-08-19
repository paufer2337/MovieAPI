using MovieApi.DTOs;
using MovieApi.Repositories;

namespace MovieApi.Services;

public sealed class ReportsService : IReportsService
{
    private const int TopMoviesPerGenre = 5;
    private readonly IReportsRepository _repository;

    public ReportsService(IReportsRepository repository) =>
        _repository = repository;

    public async Task<List<TopMoviesByGenreDto>> GetTopMoviesByGenreAsync()
    {
        var movies = await _repository.GetMovieRatingsAsync();

        return movies
            .SelectMany(movie => ParseGenres(movie.Genre)
                .Select(genre => new { Genre = genre, Movie = movie }))
            .GroupBy(item => item.Genre, StringComparer.OrdinalIgnoreCase)
            .OrderBy(group => group.Key, StringComparer.OrdinalIgnoreCase)
            .Select(group => new TopMoviesByGenreDto(
                group.Key,
                RankMovies(group
                    .Select(item => item.Movie)
                    .OrderByDescending(movie => movie.AverageRating.HasValue)
                    .ThenByDescending(movie => movie.AverageRating)
                    .ThenByDescending(movie => movie.ReviewCount)
                    .ThenBy(movie => movie.Title, StringComparer.OrdinalIgnoreCase)
                    .ThenBy(movie => movie.MovieId)
                    .Take(TopMoviesPerGenre))))
            .ToList();
    }

    public async Task<List<MovieAverageRatingDto>> GetAverageRatingsAsync()
    {
        var movies = await _repository.GetMovieRatingsAsync();

        return movies
            .OrderByDescending(movie => movie.AverageRating.HasValue)
            .ThenByDescending(movie => movie.AverageRating)
            .ThenByDescending(movie => movie.ReviewCount)
            .ThenBy(movie => movie.Title, StringComparer.OrdinalIgnoreCase)
            .ThenBy(movie => movie.MovieId)
            .Select(movie => new MovieAverageRatingDto(
                movie.MovieId,
                movie.Title,
                movie.AverageRating,
                movie.ReviewCount))
            .ToList();
    }

    public async Task<List<ActiveActorDto>> GetMostActiveActorsAsync()
    {
        var actors = await _repository.GetActorActivityAsync();

        return actors
            .OrderByDescending(actor => actor.MovieCount)
            .ThenBy(actor => actor.Name, StringComparer.OrdinalIgnoreCase)
            .ThenBy(actor => actor.ActorId)
            .Select((actor, index) => new ActiveActorDto(
                index + 1,
                actor.ActorId,
                actor.Name,
                actor.MovieCount))
            .ToList();
    }

    private static List<RankedMovieDto> RankMovies(
        IEnumerable<MovieRatingReportRow> movies) =>
        movies
            .Select((movie, index) => new RankedMovieDto(
                index + 1,
                movie.MovieId,
                movie.Title,
                movie.AverageRating,
                movie.ReviewCount))
            .ToList();

    private static IEnumerable<string> ParseGenres(string value) =>
        value
            .Split(['/', ','], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(genre => !string.IsNullOrWhiteSpace(genre))
            .Distinct(StringComparer.OrdinalIgnoreCase);
}
