using Microsoft.EntityFrameworkCore;
using MovieApi.Data;
using MovieApi.Models;




namespace MovieApi.Repositories;

public class MovieRepository : IMovieRepository
{
    private readonly MovieContext _context;
    public MovieRepository(MovieContext context) => _context = context;

    public Task<List<Movie>> GetAllAsync(string? genre, int? year, string? 
    search, string? sortBy, bool descending, int page, int pageSize)
    {
        var query = _context.Movies.AsQueryable();
        if (!string.IsNullOrWhiteSpace(genre)) query = query.Where(m => m.Genre.ToLower().Contains(genre.ToLower()));
        if (year.HasValue) query = query.Where(m => m.Year == year.Value);
        if (!string.IsNullOrWhiteSpace(search))
        query = query.Where(m => m.Title.ToLower().Contains(search.ToLower()));

        query = sortBy?.ToLower() switch
        {
            "title" => descending ? query.OrderByDescending(m => m.Title) : query.OrderBy(m => m.Title),
            "year" => descending ? query.OrderByDescending(m => m.Year) : query.OrderBy(m => m.Year),
            "duration" => descending ? query.OrderByDescending(m => m.Duration) : query.OrderBy(m => m.Duration),
            _ => query.OrderBy(m => m.Id)
        };

        page = page < 1 ? 1 : page;
        pageSize = pageSize < 1 ? 10 : pageSize;
        pageSize = pageSize > 50 ? 50 : pageSize;

        return query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
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
