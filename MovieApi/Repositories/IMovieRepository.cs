using MovieApi.Models;





namespace MovieApi.Repositories;

public interface IMovieRepository
{
    Task<List<Movie>> GetAllAsync(string? genre, int? year, string? 
    search, string? sortBy, bool descending, int page, int pageSize);
    Task<Movie?> GetByIdAsync(int id);
    Task<Movie?> GetDetailsAsync(int id);
    Task<List<Actor>> GetActorsAsync();
    Task<Actor?> GetActorByIdAsync(int actorId);
    Task<bool> MovieActorExistsAsync(int movieId, int actorId);
    Task<List<Review>> GetReviewsAsync(int movieId);
    Task<Review?> GetReviewAsync(int movieId, int reviewId);
    Task AddAsync(Movie movie);
    Task AddReviewAsync(Review review);
    Task AddMovieActorAsync(MovieActor movieActor);
    Task SaveAsync();
    void Delete(Movie movie);
    void DeleteReview(Review review);
}
