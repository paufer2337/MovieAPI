using Moq;
using MovieApi.DTOs;
using MovieApi.Models;
using MovieApi.Repositories;
using MovieApi.Services;





namespace MovieAPI.Tests.Services;

public class MovieServiceTests
{
    private readonly Mock<IMovieRepository> _repoMock;
    private readonly MovieService _service;

    public MovieServiceTests()
    {
        _repoMock = new Mock<IMovieRepository>();
        _service = new MovieService(_repoMock.Object);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsMovie_WhenExists()
    {
        var movie = new Movie
        {
            Id = 1,
            Title = "Gladiator",
            Year = 2000,
            Genre = "Action/Drama",
            Duration = 155
        };

        _repoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(movie);

        var result = await _service.GetByIdAsync(1);

        Assert.NotNull(result);
        Assert.Equal("Gladiator", result.Title);
        Assert.Equal(2000, result.Year);
    }

    [Fact]
    public async Task GetByIdAsync_ReturnsNull_WhenDoesNotExist()
    {
        _repoMock.Setup(r => r.GetByIdAsync(999)).ReturnsAsync((Movie?)null);

        var result = await _service.GetByIdAsync(999);

        Assert.Null(result);
    }

    [Fact]
    public async Task GetDetailsAsync_MapsActorRole()
    {
        var movie = new Movie
        {
            Id = 7,
            Title = "The Cat Returns",
            Year = 2002,
            Genre = "Anime/Adventure/Fantasy",
            Duration = 75
        };
        var actor = new Actor
        {
            Id = 11,
            Name = "Chizuru Ikewaki",
            BirthYear = 1981
        };
        movie.MovieActors.Add(new MovieActor
        {
            Movie = movie,
            MovieId = movie.Id,
            Actor = actor,
            ActorId = actor.Id,
            Role = "Haru Yoshioka"
        });
        _repoMock.Setup(r => r.GetDetailsAsync(7)).ReturnsAsync(movie);

        var result = await _service.GetDetailsAsync(7);

        var returnedActor = Assert.Single(Assert.IsType<List<ActorDto>>(result?.Actors));
        Assert.Equal("Chizuru Ikewaki", returnedActor.Name);
        Assert.Equal(1981, returnedActor.BirthYear);
        Assert.Equal("Haru Yoshioka", returnedActor.Role);
    }

    [Fact]
    public async Task GetActorsAsync_MapsAllActors()
    {
        _repoMock.Setup(repository => repository.GetActorsAsync()).ReturnsAsync(
            new List<Actor>
            {
                new() { Id = 2, Name = "Actor Two", BirthYear = 1980 },
                new() { Id = 1, Name = "Actor One", BirthYear = 1970 }
            });

        var result = await _service.GetActorsAsync();

        Assert.Collection(
            result,
            actor =>
            {
                Assert.Equal(2, actor.Id);
                Assert.Equal("Actor Two", actor.Name);
                Assert.Equal(string.Empty, actor.Role);
            },
            actor => Assert.Equal(1, actor.Id));
    }

    [Fact]
    public async Task AddActorAsync_CreatesLink_WithTrimmedRole()
    {
        var movie = new Movie { Id = 7, Title = "Spirited Away" };
        var actor = new Actor { Id = 11, Name = "Rumi Hiiragi", BirthYear = 1987 };
        var dto = new MovieActorCreateDto { Role = "  Chihiro  " };
        _repoMock.Setup(repository => repository.GetByIdAsync(7)).ReturnsAsync(movie);
        _repoMock.Setup(repository => repository.GetActorByIdAsync(11)).ReturnsAsync(actor);
        _repoMock.Setup(repository => repository.MovieActorExistsAsync(7, 11))
            .ReturnsAsync(false);

        var result = await _service.AddActorAsync(7, 11, dto);

        Assert.Equal(AddMovieActorStatus.Created, result.Status);
        Assert.Equal(new ActorDto(11, "Rumi Hiiragi", 1987, "Chihiro"), result.Actor);
        _repoMock.Verify(repository => repository.AddMovieActorAsync(
            It.Is<MovieActor>(movieActor =>
                movieActor.MovieId == 7 &&
                movieActor.ActorId == 11 &&
                movieActor.Role == "Chihiro")), Times.Once);
        _repoMock.Verify(repository => repository.SaveAsync(), Times.Once);
    }

    [Fact]
    public async Task AddActorAsync_ReturnsMovieNotFound_WhenMovieIsMissing()
    {
        _repoMock.Setup(repository => repository.GetByIdAsync(404))
            .ReturnsAsync((Movie?)null);

        var result = await _service.AddActorAsync(
            404,
            11,
            new MovieActorCreateDto { Role = "Huvudroll" });

        Assert.Equal(AddMovieActorStatus.MovieNotFound, result.Status);
        _repoMock.Verify(repository => repository.GetActorByIdAsync(It.IsAny<int>()), Times.Never);
        _repoMock.Verify(repository => repository.SaveAsync(), Times.Never);
    }

    [Fact]
    public async Task AddActorAsync_ReturnsActorNotFound_WhenActorIsMissing()
    {
        _repoMock.Setup(repository => repository.GetByIdAsync(7))
            .ReturnsAsync(new Movie { Id = 7 });
        _repoMock.Setup(repository => repository.GetActorByIdAsync(404))
            .ReturnsAsync((Actor?)null);

        var result = await _service.AddActorAsync(
            7,
            404,
            new MovieActorCreateDto { Role = "Huvudroll" });

        Assert.Equal(AddMovieActorStatus.ActorNotFound, result.Status);
        _repoMock.Verify(
            repository => repository.MovieActorExistsAsync(It.IsAny<int>(), It.IsAny<int>()),
            Times.Never);
        _repoMock.Verify(repository => repository.SaveAsync(), Times.Never);
    }

    [Fact]
    public async Task AddActorAsync_ReturnsDuplicate_WithoutWriting()
    {
        _repoMock.Setup(repository => repository.GetByIdAsync(7))
            .ReturnsAsync(new Movie { Id = 7 });
        _repoMock.Setup(repository => repository.GetActorByIdAsync(11))
            .ReturnsAsync(new Actor { Id = 11 });
        _repoMock.Setup(repository => repository.MovieActorExistsAsync(7, 11))
            .ReturnsAsync(true);

        var result = await _service.AddActorAsync(
            7,
            11,
            new MovieActorCreateDto { Role = "Huvudroll" });

        Assert.Equal(AddMovieActorStatus.Duplicate, result.Status);
        _repoMock.Verify(
            repository => repository.AddMovieActorAsync(It.IsAny<MovieActor>()),
            Times.Never);
        _repoMock.Verify(repository => repository.SaveAsync(), Times.Never);
    }

    [Theory]
    [InlineData(0, 11, "Huvudroll")]
    [InlineData(7, 0, "Huvudroll")]
    [InlineData(7, 11, " ")]
    [InlineData(7, 11, "X")]
    public async Task AddActorAsync_ReturnsInvalidRequest_ForInvalidInput(
        int movieId,
        int actorId,
        string role)
    {
        var result = await _service.AddActorAsync(
            movieId,
            actorId,
            new MovieActorCreateDto { Role = role });

        Assert.Equal(AddMovieActorStatus.InvalidRequest, result.Status);
        _repoMock.Verify(repository => repository.GetByIdAsync(It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task CreateAsync_AddsMovie_AndReturnsDto()
    {
        var dto = new MovieCreateDto
        {
            Title = "Avatar",
            Year = 2009,
            Genre = "Sci-Fi/Adventure",
            Duration = 162
        };

        _repoMock.Setup(r => r.AddAsync(It.IsAny<Movie>()))
            .Returns(Task.CompletedTask);

        _repoMock.Setup(r => r.SaveAsync())
            .Returns(Task.CompletedTask);

        var result = await _service.CreateAsync(dto);

        Assert.Equal("Avatar", result.Title);
        Assert.Equal(2009, result.Year);

        _repoMock.Verify(r => r.AddAsync(It.IsAny<Movie>()), Times.Once);
        _repoMock.Verify(r => r.SaveAsync(), Times.Once);
    }

    [Fact]
    public async Task CreateReviewAsync_AddsReviewForMovie_AndReturnsDto()
    {
        var movie = new Movie { Id = 7, Title = "Spirited Away" };
        var dto = new ReviewCreateDto
        {
            ReviewerName = "Archive Visitor",
            Comment = "A beautiful and imaginative film.",
            Rating = 5
        };

        _repoMock.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(movie);
        _repoMock.Setup(r => r.AddReviewAsync(It.IsAny<Review>()))
            .Returns(Task.CompletedTask);
        _repoMock.Setup(r => r.SaveAsync()).Returns(Task.CompletedTask);

        var result = await _service.CreateReviewAsync(7, dto);

        Assert.NotNull(result);
        Assert.Equal(dto.ReviewerName, result.ReviewerName);
        Assert.Equal(dto.Comment, result.Comment);
        Assert.Equal(5, result.Rating);
        _repoMock.Verify(r => r.AddReviewAsync(It.Is<Review>(review =>
            review.MovieId == 7 && review.Rating == 5)), Times.Once);
        _repoMock.Verify(r => r.SaveAsync(), Times.Once);
    }

    [Fact]
    public async Task CreateReviewAsync_ReturnsNull_WhenMovieDoesNotExist()
    {
        var dto = new ReviewCreateDto
        {
            ReviewerName = "Archive Visitor",
            Comment = "A thoughtful review comment.",
            Rating = 4
        };

        _repoMock.Setup(r => r.GetByIdAsync(404)).ReturnsAsync((Movie?)null);

        var result = await _service.CreateReviewAsync(404, dto);

        Assert.Null(result);
        _repoMock.Verify(r => r.AddReviewAsync(It.IsAny<Review>()), Times.Never);
        _repoMock.Verify(r => r.SaveAsync(), Times.Never);
    }

    [Fact]
    public async Task GetReviewsAsync_ReturnsMappedReviews_ForExistingMovie()
    {
        var reviews = new List<Review>
        {
            new()
            {
                Id = 8,
                MovieId = 7,
                ReviewerName = "Archive Curator",
                Comment = "A balanced and thoughtful archive review.",
                Rating = 4
            }
        };
        _repoMock.Setup(r => r.GetByIdAsync(7))
            .ReturnsAsync(new Movie { Id = 7, Title = "Spirited Away" });
        _repoMock.Setup(r => r.GetReviewsAsync(7)).ReturnsAsync(reviews);

        var result = await _service.GetReviewsAsync(7);

        var review = Assert.Single(Assert.IsType<List<ReviewDto>>(result));
        Assert.Equal(8, review.Id);
        Assert.Equal("Archive Curator", review.ReviewerName);
    }

    [Fact]
    public async Task GetReviewsAsync_ReturnsNull_WhenMovieDoesNotExist()
    {
        _repoMock.Setup(r => r.GetByIdAsync(404)).ReturnsAsync((Movie?)null);

        var result = await _service.GetReviewsAsync(404);

        Assert.Null(result);
        _repoMock.Verify(r => r.GetReviewsAsync(It.IsAny<int>()), Times.Never);
    }

    [Fact]
    public async Task DeleteReviewAsync_DeletesOwnedReview_AndSavesOnce()
    {
        var movie = new Movie { Id = 7, Title = "Spirited Away" };
        var review = new Review { Id = 8, MovieId = 7 };
        _repoMock.Setup(r => r.GetByIdAsync(7)).ReturnsAsync(movie);
        _repoMock.Setup(r => r.GetReviewAsync(7, 8)).ReturnsAsync(review);

        var result = await _service.DeleteReviewAsync(7, 8);

        Assert.True(result);
        _repoMock.Verify(r => r.DeleteReview(review), Times.Once);
        _repoMock.Verify(r => r.SaveAsync(), Times.Once);
    }

    [Fact]
    public async Task DeleteReviewAsync_ReturnsFalse_WhenMovieDoesNotExist()
    {
        _repoMock.Setup(r => r.GetByIdAsync(404)).ReturnsAsync((Movie?)null);

        var result = await _service.DeleteReviewAsync(404, 8);

        Assert.False(result);
        _repoMock.Verify(r => r.GetReviewAsync(It.IsAny<int>(), It.IsAny<int>()), Times.Never);
        _repoMock.Verify(r => r.DeleteReview(It.IsAny<Review>()), Times.Never);
        _repoMock.Verify(r => r.SaveAsync(), Times.Never);
    }

    [Fact]
    public async Task DeleteReviewAsync_ReturnsFalse_WhenReviewIsMissingOrBelongsToAnotherMovie()
    {
        _repoMock.Setup(r => r.GetByIdAsync(7))
            .ReturnsAsync(new Movie { Id = 7, Title = "Spirited Away" });
        _repoMock.Setup(r => r.GetReviewAsync(7, 99)).ReturnsAsync((Review?)null);

        var result = await _service.DeleteReviewAsync(7, 99);

        Assert.False(result);
        _repoMock.Verify(r => r.GetReviewAsync(7, 99), Times.Once);
        _repoMock.Verify(r => r.DeleteReview(It.IsAny<Review>()), Times.Never);
        _repoMock.Verify(r => r.SaveAsync(), Times.Never);
    }

    [Fact]
    public async Task UpdateAsync_ReturnsFalse_WhenDoesNotExist()
    {
        var dto = new MovieUpdateDto
        {
            Title = "Unknown",
            Year = 2020,
            Genre = "Drama",
            Duration = 100
        };

        _repoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync((Movie?)null);

        var result = await _service.UpdateAsync(1, dto);

        Assert.False(result);
        _repoMock.Verify(r => r.SaveAsync(), Times.Never);
    }

    [Fact]
    public async Task DeleteAsync_ReturnsTrue_WhenExists()
    {
        var movie = new Movie
        {
            Id = 1,
            Title = "Troy",
            Year = 2004,
            Genre = "History/Action",
            Duration = 163
        };

        _repoMock.Setup(r => r.GetByIdAsync(1)).ReturnsAsync(movie);
        _repoMock.Setup(r => r.SaveAsync()).Returns(Task.CompletedTask);

        var result = await _service.DeleteAsync(1);

        Assert.True(result);
        _repoMock.Verify(r => r.Delete(movie), Times.Once);
        _repoMock.Verify(r => r.SaveAsync(), Times.Once);
    }
}
