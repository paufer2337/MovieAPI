using MovieApi.Models;





namespace MovieApi.Repositories;

public interface IMovieRepository
{
    Task<List<Movie>> GetAllAsync(string? genre, int? year);
    Task<Movie?> GetByIdAsync(int id);
    Task<Movie?> GetDetailsAsync(int id);
    Task AddAsync(Movie movie);
    Task SaveAsync();
    void Delete(Movie movie);
}
