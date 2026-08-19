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

    public async Task<List<ActorDto>> GetActorsAsync()
    {
        var actors = await _repo.GetActorsAsync();
        return actors.Select(actor => ToActorDto(actor, string.Empty)).ToList();
    }

    public async Task<AddMovieActorResult> AddActorAsync(
        int movieId,
        int actorId,
        MovieActorCreateDto dto)
    {
        var role = dto.Role?.Trim();
        if (movieId <= 0 || actorId <= 0 || string.IsNullOrWhiteSpace(role) ||
            role.Length is < 2 or > 100)
        {
            return new(AddMovieActorStatus.InvalidRequest);
        }

        var movie = await _repo.GetByIdAsync(movieId);
        if (movie is null) return new(AddMovieActorStatus.MovieNotFound);

        var actor = await _repo.GetActorByIdAsync(actorId);
        if (actor is null) return new(AddMovieActorStatus.ActorNotFound);

        if (await _repo.MovieActorExistsAsync(movieId, actorId))
        {
            return new(AddMovieActorStatus.Duplicate);
        }

        var movieActor = new MovieActor
        {
            MovieId = movieId,
            Movie = movie,
            ActorId = actorId,
            Actor = actor,
            Role = role
        };

        await _repo.AddMovieActorAsync(movieActor);
        await _repo.SaveAsync();

        return new(AddMovieActorStatus.Created, ToActorDto(actor, role));
    }

    public async Task<List<ReviewDto>?> GetReviewsAsync(int movieId)
    {
        if (await _repo.GetByIdAsync(movieId) is null) return null;

        var reviews = await _repo.GetReviewsAsync(movieId);
        return reviews.Select(ToReviewDto).ToList();
    }

    public async Task<MovieDto> CreateAsync(MovieCreateDto dto)
    {
        var movie = new Movie { Title = dto.Title, Year = dto.Year, Genre = dto.Genre, Duration = dto.Duration };
        await _repo.AddAsync(movie);
        await _repo.SaveAsync();
        return ToDto(movie);
    }

    public async Task<ReviewDto?> CreateReviewAsync(int movieId, ReviewCreateDto dto)
    {
        var movie = await _repo.GetByIdAsync(movieId);
        if (movie is null) return null;

        var review = new Review
        {
            MovieId = movieId,
            ReviewerName = dto.ReviewerName,
            Comment = dto.Comment,
            Rating = dto.Rating
        };

        await _repo.AddReviewAsync(review);
        await _repo.SaveAsync();

        return new ReviewDto(review.Id, review.ReviewerName, review.Comment, review.Rating);
    }

    public async Task<bool> DeleteReviewAsync(int movieId, int reviewId)
    {
        if (await _repo.GetByIdAsync(movieId) is null) return false;

        var review = await _repo.GetReviewAsync(movieId, reviewId);
        if (review is null) return false;

        _repo.DeleteReview(review);
        await _repo.SaveAsync();
        return true;
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

    private static ReviewDto ToReviewDto(Review review) =>
        new(review.Id, review.ReviewerName, review.Comment, review.Rating);

    private static ActorDto ToActorDto(Actor actor, string role) =>
        new(actor.Id, actor.Name, actor.BirthYear, role);

    private static MovieDetailDto ToDetailDto(Movie m) => new(
        m.Id, m.Title, m.Year, m.Genre, m.Duration,
        m.MovieDetails is null ? null : new MovieDetailsDto(m.MovieDetails.Synopsis, m.MovieDetails.Language, m.MovieDetails.Budget),
        m.Reviews.Select(ToReviewDto).ToList(),
        m.MovieActors.Select(ma => ToActorDto(ma.Actor, ma.Role)).ToList());
}
