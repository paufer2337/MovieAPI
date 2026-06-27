using MovieApi.Models;





namespace MovieApi.Repositories;

public interface IMovieRepository
{
    Task<List<Movie>> GetAllAsync(string? genre, int? year, string? 
    search, string? sortBy, bool descending, int page, int pageSize);
    Task<Movie?> GetByIdAsync(int id);
    Task<Movie?> GetDetailsAsync(int id);
    Task AddAsync(Movie movie);
    Task SaveAsync();
    void Delete(Movie movie);
}
