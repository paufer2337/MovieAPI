using MovieApi.DTOs;

namespace MovieApi.Services;

public interface IMovieService
{
    Task<List<MovieDto>> GetAllAsync(string? genre, int? year, string? 
    search, string? sortBy, bool descending, int page, int pageSize);
    Task<MovieDto?> GetByIdAsync(int id);
    Task<MovieDetailDto?> GetDetailsAsync(int id);
    Task<List<ReviewDto>?> GetReviewsAsync(int movieId);
    Task<MovieDto> CreateAsync(MovieCreateDto dto);
    Task<ReviewDto?> CreateReviewAsync(int movieId, ReviewCreateDto dto);
    Task<bool> DeleteReviewAsync(int movieId, int reviewId);
    Task<bool> UpdateAsync(int id, MovieUpdateDto dto);
    Task<bool> DeleteAsync(int id);
}
