using MovieApi.DTOs;

namespace MovieApi.Services;

public interface IMovieService
{
    Task<List<MovieDto>> GetAllAsync(string? genre, int? year);
    Task<MovieDto?> GetByIdAsync(int id);
    Task<MovieDetailDto?> GetDetailsAsync(int id);
    Task<MovieDto> CreateAsync(MovieCreateDto dto);
    Task<bool> UpdateAsync(int id, MovieUpdateDto dto);
    Task<bool> DeleteAsync(int id);
}