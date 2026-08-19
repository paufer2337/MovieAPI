using MovieApi.DTOs;

namespace MovieApi.Services;

public interface IReportsService
{
    Task<List<TopMoviesByGenreDto>> GetTopMoviesByGenreAsync();
    Task<List<MovieAverageRatingDto>> GetAverageRatingsAsync();
    Task<List<ActiveActorDto>> GetMostActiveActorsAsync();
}
