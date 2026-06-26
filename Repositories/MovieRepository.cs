using Microsoft.EntityFrameworkCore;
using MovieApi.Data;
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

public class MovieRepository : IMovieRepository
{
    private readonly MovieContext _context;
    public MovieRepository(MovieContext context) => _context = context;

    public Task<List<Movie>> GetAllAsync(string? genre, int? year)
    {
        var query = _context.Movies.AsQueryable();
        if (!string.IsNullOrWhiteSpace(genre)) query = query.Where(m => m.Genre == genre);
        if (year.HasValue) query = query.Where(m => m.Year == year.Value);
        return query.ToListAsync();
    }

    public Task<Movie?> GetByIdAsync(int id) => _context.Movies.FindAsync(id).AsTask();

    public Task<Movie?> GetDetailsAsync(int id) => _context.Movies
        .Include(m => m.MovieDetails)
        .Include(m => m.Reviews)
        .Include(m => m.MovieActors).ThenInclude(ma => ma.Actor)
        .FirstOrDefaultAsync(m => m.Id == id);

    public async Task AddAsync(Movie movie) => await _context.Movies.AddAsync(movie);
    public void Delete(Movie movie) => _context.Movies.Remove(movie);
    public Task SaveAsync() => _context.SaveChangesAsync();
}
