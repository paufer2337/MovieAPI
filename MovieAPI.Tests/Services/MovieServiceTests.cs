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