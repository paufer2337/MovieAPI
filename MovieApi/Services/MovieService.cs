using MovieApi.DTOs;
using MovieApi.Models;
using MovieApi.Repositories;




namespace MovieApi.Services;

public class MovieService : IMovieService
{
    private readonly IMovieRepository _repo;
    public MovieService(IMovieRepository repo) => _repo = repo;


    public async Task<List<MovieDto>> GetAllAsync(string? genre, int? year, 
    string? search, string? sortBy, bool descending, int page, int pageSize)
    {
        var movies = await _repo.GetAllAsync(genre, year, 
        search, sortBy, descending, page, pageSize);

        return movies.Select(ToDto).ToList();
    }


    public async Task<MovieDto?> GetByIdAsync(int id)
    {
        var movie = await _repo.GetByIdAsync(id);
        return movie is null ? null : ToDto(movie);
    }


    public async Task<MovieDetailDto?> GetDetailsAsync(int id)
    {
        var movie = await _repo.GetDetailsAsync(id);
        return movie is null ? null : ToDetailDto(movie);
    }

    public async Task<MovieDto> CreateAsync(MovieCreateDto dto)
    {
        var movie = new Movie { Title = dto.Title, Year = dto.Year, Genre = dto.Genre, Duration = dto.Duration };
        await _repo.AddAsync(movie);
        await _repo.SaveAsync();
        return ToDto(movie);
    }

    public async Task<bool> UpdateAsync(int id, MovieUpdateDto dto)
    {
        var movie = await _repo.GetByIdAsync(id);
        if (movie is null) return false;
        movie.Title = dto.Title; movie.Year = dto.Year; movie.Genre = dto.Genre; movie.Duration = dto.Duration;
        await _repo.SaveAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var movie = await _repo.GetByIdAsync(id);
        if (movie is null) return false;
        _repo.Delete(movie);
        await _repo.SaveAsync();
        return true;
    }

    private static MovieDto ToDto(Movie m) => new(m.Id, m.Title, m.Year, m.Genre, m.Duration);

    private static MovieDetailDto ToDetailDto(Movie m) => new(
        m.Id, m.Title, m.Year, m.Genre, m.Duration,
        m.MovieDetails is null ? null : new MovieDetailsDto(m.MovieDetails.Synopsis, m.MovieDetails.Language, m.MovieDetails.Budget),
        m.Reviews.Select(r => new ReviewDto(r.Id, r.ReviewerName, r.Comment, r.Rating)).ToList(),
        m.MovieActors.Select(ma => new ActorDto(ma.Actor.Id, ma.Actor.Name, ma.Actor.BirthYear, ma.Role)).ToList());
}
