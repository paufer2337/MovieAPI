using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using MovieApi.Data;
using MovieApi.Models;
using MovieApi.Repositories;

namespace MovieAPI.Tests.Repositories;

public class MovieRepositoryTests
{
    [Fact]
    public async Task ReviewQueries_AreScopedToRequestedMovie()
    {
        using var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();
        await using var context = CreateContext(connection);
        await context.Database.EnsureCreatedAsync();
        var firstMovie = new Movie
        {
            Title = "First Film",
            Year = 2000,
            Genre = "Drama",
            Duration = 100
        };
        var secondMovie = new Movie
        {
            Title = "Second Film",
            Year = 2001,
            Genre = "Drama",
            Duration = 101
        };
        context.Movies.AddRange(firstMovie, secondMovie);
        await context.SaveChangesAsync();
        var ownedReview = new Review
        {
            MovieId = firstMovie.Id,
            ReviewerName = "Archive Visitor",
            Comment = "A thoughtful review for the first film.",
            Rating = 4
        };
        var otherReview = new Review
        {
            MovieId = secondMovie.Id,
            ReviewerName = "Archive Curator",
            Comment = "A separate review for the second film.",
            Rating = 3
        };
        context.Reviews.AddRange(ownedReview, otherReview);
        await context.SaveChangesAsync();
        var repository = new MovieRepository(context);

        var reviews = await repository.GetReviewsAsync(firstMovie.Id);
        var found = await repository.GetReviewAsync(firstMovie.Id, ownedReview.Id);
        var wrongMovie = await repository.GetReviewAsync(secondMovie.Id, ownedReview.Id);

        Assert.Equal(ownedReview.Id, Assert.Single(reviews).Id);
        Assert.Equal(ownedReview.Id, found?.Id);
        Assert.Null(wrongMovie);
    }

    [Fact]
    public async Task DeleteReview_RemovesOnlyRequestedReview()
    {
        using var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();
        await using var context = CreateContext(connection);
        await context.Database.EnsureCreatedAsync();
        var movie = new Movie
        {
            Title = "Archive Film",
            Year = 2000,
            Genre = "Drama",
            Duration = 100
        };
        var firstReview = new Review
        {
            Movie = movie,
            ReviewerName = "Archive Visitor",
            Comment = "The review that should be removed.",
            Rating = 4
        };
        var secondReview = new Review
        {
            Movie = movie,
            ReviewerName = "Archive Curator",
            Comment = "The review that should remain stored.",
            Rating = 5
        };
        context.Reviews.AddRange(firstReview, secondReview);
        await context.SaveChangesAsync();
        var repository = new MovieRepository(context);

        repository.DeleteReview(firstReview);
        await repository.SaveAsync();

        Assert.Null(await context.Reviews.FindAsync(firstReview.Id));
        Assert.NotNull(await context.Reviews.FindAsync(secondReview.Id));
    }

    private static MovieContext CreateContext(SqliteConnection connection)
    {
        var options = new DbContextOptionsBuilder<MovieContext>()
            .UseSqlite(connection)
            .Options;
        return new MovieContext(options);
    }
}
