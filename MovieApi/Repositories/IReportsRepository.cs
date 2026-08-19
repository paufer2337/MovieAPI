namespace MovieApi.Repositories;

public interface IReportsRepository
{
    Task<List<MovieRatingReportRow>> GetMovieRatingsAsync();
    Task<List<ActorActivityReportRow>> GetActorActivityAsync();
}
