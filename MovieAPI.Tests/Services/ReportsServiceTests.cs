using Moq;
using MovieApi.Repositories;
using MovieApi.Services;

namespace MovieAPI.Tests.Services;

public class ReportsServiceTests
{
    private readonly Mock<IReportsRepository> _repository = new();

    [Fact]
    public async Task GetTopMoviesByGenreAsync_SplitsGenres_RanksRatedMovies_AndTakesFive()
    {
        _repository.Setup(item => item.GetMovieRatingsAsync()).ReturnsAsync(
        [
            new(1, "Alpha", "Drama/Action", 4, 2),
            new(2, "Bravo", "drama", 5, 1),
            new(3, "Charlie", "Drama", null, 0),
            new(4, "Delta", "Drama", 4, 5),
            new(5, "Echo", "Drama", 3, 1),
            new(6, "Foxtrot", "Drama", 2, 1),
            new(7, "Golf", "Drama", 1, 1),
            new(8, "Unrated Documentary", "Documentary", null, 0)
        ]);
        var service = new ReportsService(_repository.Object);

        var result = await service.GetTopMoviesByGenreAsync();

        Assert.Equal(["Action", "Documentary", "Drama"], result.Select(item => item.Genre));

        var drama = result.Single(item => item.Genre == "Drama");
        Assert.Equal(5, drama.Movies.Count);
        Assert.Equal([2, 4, 1, 5, 6], drama.Movies.Select(movie => movie.MovieId));
        Assert.Equal([1, 2, 3, 4, 5], drama.Movies.Select(movie => movie.Rank));

        var documentary = Assert.Single(
            result.Single(item => item.Genre == "Documentary").Movies);
        Assert.Null(documentary.AverageRating);
        Assert.Equal(0, documentary.ReviewCount);
    }

    [Fact]
    public async Task GetAverageRatingsAsync_MapsAllMovies_AndPlacesUnratedLast()
    {
        _repository.Setup(item => item.GetMovieRatingsAsync()).ReturnsAsync(
        [
            new(2, "Unrated", "Drama", null, 0),
            new(1, "Rated", "Drama", 4.5, 2)
        ]);
        var service = new ReportsService(_repository.Object);

        var result = await service.GetAverageRatingsAsync();

        Assert.Collection(
            result,
            movie =>
            {
                Assert.Equal(1, movie.MovieId);
                Assert.Equal(4.5, movie.AverageRating);
                Assert.Equal(2, movie.ReviewCount);
            },
            movie =>
            {
                Assert.Equal(2, movie.MovieId);
                Assert.Null(movie.AverageRating);
                Assert.Equal(0, movie.ReviewCount);
            });
    }

    [Fact]
    public async Task GetMostActiveActorsAsync_RanksByMovieCount_WithStableTies()
    {
        _repository.Setup(item => item.GetActorActivityAsync()).ReturnsAsync(
        [
            new(3, "Zero Actor", 0),
            new(2, "Zulu Actor", 2),
            new(1, "Alpha Actor", 2)
        ]);
        var service = new ReportsService(_repository.Object);

        var result = await service.GetMostActiveActorsAsync();

        Assert.Equal([1, 2, 3], result.Select(actor => actor.Rank));
        Assert.Equal([1, 2, 3], result.Select(actor => actor.ActorId));
        Assert.Equal([2, 2, 0], result.Select(actor => actor.MovieCount));
    }

    [Fact]
    public async Task ReportMethods_ReturnEmptyLists_ForEmptyDatabaseResults()
    {
        _repository.Setup(item => item.GetMovieRatingsAsync())
            .ReturnsAsync(new List<MovieRatingReportRow>());
        _repository.Setup(item => item.GetActorActivityAsync())
            .ReturnsAsync(new List<ActorActivityReportRow>());
        var service = new ReportsService(_repository.Object);

        Assert.Empty(await service.GetTopMoviesByGenreAsync());
        Assert.Empty(await service.GetAverageRatingsAsync());
        Assert.Empty(await service.GetMostActiveActorsAsync());
    }
}
