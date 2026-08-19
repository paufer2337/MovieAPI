using System.Data.Common;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using MovieApi.Data;
using MovieApi.Models;
using MovieApi.Repositories;

namespace MovieAPI.Tests.Repositories;

public class ReportsRepositoryTests
{
    [Fact]
    public async Task GetMovieRatingsAsync_ReturnsAveragesAndUnratedMovies_InOneQuery()
    {
        using var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();
        var interceptor = new QueryCountingInterceptor();
        await using var context = CreateContext(connection, interceptor);
        await context.Database.EnsureCreatedAsync();
        var rated = CreateMovie("Rated Film", "Drama");
        var unrated = CreateMovie("Unrated Film", "Drama");
        rated.Reviews.Add(new Review
        {
            ReviewerName = "First Reviewer",
            Comment = "A complete first archive review.",
            Rating = 4
        });
        rated.Reviews.Add(new Review
        {
            ReviewerName = "Second Reviewer",
            Comment = "A complete second archive review.",
            Rating = 5
        });
        context.Movies.AddRange(rated, unrated);
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();
        interceptor.Reset();
        var repository = new ReportsRepository(context);

        var result = await repository.GetMovieRatingsAsync();

        Assert.Equal(1, interceptor.QueryCount);
        Assert.Collection(
            result,
            movie =>
            {
                Assert.Equal("Rated Film", movie.Title);
                Assert.Equal(4.5, movie.AverageRating);
                Assert.Equal(2, movie.ReviewCount);
            },
            movie =>
            {
                Assert.Equal("Unrated Film", movie.Title);
                Assert.Null(movie.AverageRating);
                Assert.Equal(0, movie.ReviewCount);
            });
    }

    [Fact]
    public async Task GetActorActivityAsync_RanksActorsIncludingUnassigned_InOneQuery()
    {
        using var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();
        var interceptor = new QueryCountingInterceptor();
        await using var context = CreateContext(connection, interceptor);
        await context.Database.EnsureCreatedAsync();
        var firstMovie = CreateMovie("First Film", "Drama");
        var secondMovie = CreateMovie("Second Film", "Action");
        var active = new Actor { Name = "Active Actor", BirthYear = 1970 };
        var occasional = new Actor { Name = "Occasional Actor", BirthYear = 1980 };
        var unassigned = new Actor { Name = "Unassigned Actor", BirthYear = 1990 };
        context.AddRange(firstMovie, secondMovie, active, occasional, unassigned);
        await context.SaveChangesAsync();
        context.MovieActors.AddRange(
            Link(firstMovie, active),
            Link(secondMovie, active),
            Link(firstMovie, occasional));
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();
        interceptor.Reset();
        var repository = new ReportsRepository(context);

        var result = await repository.GetActorActivityAsync();

        Assert.Equal(1, interceptor.QueryCount);
        Assert.Equal(
            ["Active Actor", "Occasional Actor", "Unassigned Actor"],
            result.Select(actor => actor.Name));
        Assert.Equal([2, 1, 0], result.Select(actor => actor.MovieCount));
    }

    [Fact]
    public async Task ReportQueries_ReturnEmptyLists_ForEmptyDatabase()
    {
        using var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();
        var interceptor = new QueryCountingInterceptor();
        await using var context = CreateContext(connection, interceptor);
        await context.Database.EnsureCreatedAsync();
        var repository = new ReportsRepository(context);

        interceptor.Reset();
        Assert.Empty(await repository.GetMovieRatingsAsync());
        Assert.Equal(1, interceptor.QueryCount);

        interceptor.Reset();
        Assert.Empty(await repository.GetActorActivityAsync());
        Assert.Equal(1, interceptor.QueryCount);
    }

    private static Movie CreateMovie(string title, string genre) => new()
    {
        Title = title,
        Year = 2000,
        Genre = genre,
        Duration = 100
    };

    private static MovieActor Link(Movie movie, Actor actor) => new()
    {
        MovieId = movie.Id,
        Movie = movie,
        ActorId = actor.Id,
        Actor = actor,
        Role = "Archive Role"
    };

    private static MovieContext CreateContext(
        SqliteConnection connection,
        QueryCountingInterceptor interceptor)
    {
        var options = new DbContextOptionsBuilder<MovieContext>()
            .UseSqlite(connection)
            .AddInterceptors(interceptor)
            .Options;
        return new MovieContext(options);
    }

    private sealed class QueryCountingInterceptor : DbCommandInterceptor
    {
        public int QueryCount { get; private set; }

        public void Reset() => QueryCount = 0;

        public override ValueTask<InterceptionResult<DbDataReader>> ReaderExecutingAsync(
            DbCommand command,
            CommandEventData eventData,
            InterceptionResult<DbDataReader> result,
            CancellationToken cancellationToken = default)
        {
            QueryCount++;
            return base.ReaderExecutingAsync(
                command,
                eventData,
                result,
                cancellationToken);
        }
    }
}
