using Microsoft.AspNetCore.Mvc;
using Moq;
using MovieApi.Controllers;
using MovieApi.DTOs;
using MovieApi.Services;





namespace MovieAPI.Tests.Controllers;

public class MoviesControllerTests
{
    private readonly Mock<IMovieService> _serviceMock;
    private readonly MoviesController _controller;

    public MoviesControllerTests()
    {
        _serviceMock = new Mock<IMovieService>();
        _controller = new MoviesController(_serviceMock.Object);
    }


    [Fact]
    public async Task GetMovie_ReturnsOk_WhenExists()
    {
        var movie = new MovieDto(1, "Gladiator", 2000, "Action/Drama", 155);
        _serviceMock.Setup(s => s.GetByIdAsync(1)).ReturnsAsync(movie);

        var result = await _controller.GetMovie(1);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedMovie = Assert.IsType<MovieDto>(okResult.Value);
        Assert.Equal("Gladiator", returnedMovie.Title);
    }


    [Fact]
    public async Task GetMovie_ReturnsNotFound_WhenNotExist()
    {
        _serviceMock.Setup(s => s.GetByIdAsync(999)).ReturnsAsync((MovieDto?)null);

        var result = await _controller.GetMovie(999);

        Assert.IsType<NotFoundResult>(result.Result);
    }


    [Fact]
    public async Task CreateMovie_ReturnsCreated()
    {
        var createDto = new MovieCreateDto
        {
            Title = "Avatar",
            Year = 2009,
            Genre = "Sci-Fi/Adventure",
            Duration = 162
        };

        var createdDto = new MovieDto(1, "Avatar", 2009, "Sci-Fi/Adventure", 162);

        _serviceMock.Setup(s => s.CreateAsync(createDto)).ReturnsAsync(createdDto);

        var result = await _controller.CreateMovie(createDto);

        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        Assert.Equal(nameof(MoviesController.GetMovie), createdResult.ActionName);
        Assert.Equal(createdDto, createdResult.Value);
    }


    [Fact]
    public async Task UpdateMovie_ReturnsNotFound_WhenDoesNotExist()
    {
        var updateDto = new MovieUpdateDto
        {
            Title = "Unknown",
            Year = 2020,
            Genre = "Drama",
            Duration = 100
        };

        _serviceMock.Setup(s => s.UpdateAsync(999, updateDto)).ReturnsAsync(false);

        var result = await _controller.UpdateMovie(999, updateDto);

        Assert.IsType<NotFoundResult>(result);
    }


    [Fact]
    public async Task DeleteMovie_ReturnsNoContent_WhenExists()
    {
        _serviceMock.Setup(s => s.DeleteAsync(1)).ReturnsAsync(true);

        var result = await _controller.DeleteMovie(1);

        Assert.IsType<NoContentResult>(result);
    }


    [Fact]
    public async Task GetMovies_ReturnsOk_WithQueryParameters()
    {
        var movies = new List<MovieDto>
        {
            new MovieDto(1, "Gladiator", 2000, "Action/Drama", 155),
            new MovieDto(2, "Troy", 2004, "History/Action", 163)
        };

        _serviceMock
            .Setup(s => s.GetAllAsync("Action", null, "g", "year", true, 1, 10))
            .ReturnsAsync(movies);

        var result = await _controller.GetMovies(
            genre: "Action",
            year: null,
            search: "g",
            sortBy: "year",
            descending: true,
            page: 1,
            pageSize: 10);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var returnedMovies = Assert.IsType<List<MovieDto>>(okResult.Value);

        Assert.Equal(2, returnedMovies.Count);
        
    }
}