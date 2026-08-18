using MovieApi.Models;





namespace MovieApi.Repositories;

public interface IMovieRepository
{
    Task<List<Movie>> GetAllAsync(string? genre, int? year, string? 
    search, string? sortBy, bool descending, int page, int pageSize);
    Task<Movie?> GetByIdAsync(int id);
    Task<Movie?> GetDetailsAsync(int id);
    Task<List<Review>> GetReviewsAsync(int movieId);
    Task<Review?> GetReviewAsync(int movieId, int reviewId);
    Task AddAsync(Movie movie);
    Task AddReviewAsync(Review review);
    Task SaveAsync();
    void Delete(Movie movie);
    void DeleteReview(Review review);
}
