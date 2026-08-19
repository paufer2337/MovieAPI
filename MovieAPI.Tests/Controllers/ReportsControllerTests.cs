using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Moq;
using MovieApi.Controllers;
using MovieApi.DTOs;
using MovieApi.Services;

namespace MovieAPI.Tests.Controllers;

public class ReportsControllerTests
{
    [Fact]
    public async Task GetTopMoviesByGenre_ReturnsServiceResult()
    {
        var report = new List<TopMoviesByGenreDto>
        {
            new("Drama", [new(1, 7, "Archive Film", 4.5, 2)])
        };
        var service = new Mock<IReportsService>();
        service.Setup(item => item.GetTopMoviesByGenreAsync()).ReturnsAsync(report);
        var controller = new ReportsController(service.Object);

        var result = await controller.GetTopMoviesByGenre();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(report, ok.Value);
        service.Verify(item => item.GetTopMoviesByGenreAsync(), Times.Once);
    }

    [Fact]
    public async Task GetAverageRatings_ReturnsServiceResult()
    {
        var report = new List<MovieAverageRatingDto>
        {
            new(7, "Archive Film", null, 0)
        };
        var service = new Mock<IReportsService>();
        service.Setup(item => item.GetAverageRatingsAsync()).ReturnsAsync(report);
        var controller = new ReportsController(service.Object);

        var result = await controller.GetAverageRatings();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(report, ok.Value);
        service.Verify(item => item.GetAverageRatingsAsync(), Times.Once);
    }

    [Fact]
    public async Task GetMostActiveActors_ReturnsServiceResult()
    {
        var report = new List<ActiveActorDto>
        {
            new(1, 11, "Archive Actor", 3)
        };
        var service = new Mock<IReportsService>();
        service.Setup(item => item.GetMostActiveActorsAsync()).ReturnsAsync(report);
        var controller = new ReportsController(service.Object);

        var result = await controller.GetMostActiveActors();

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(report, ok.Value);
        service.Verify(item => item.GetMostActiveActorsAsync(), Times.Once);
    }

    [Fact]
    public void ReportsController_IsExplicitlyPublic()
    {
        var allowAnonymous = typeof(ReportsController)
            .GetCustomAttributes(typeof(AllowAnonymousAttribute), inherit: true);

        Assert.Single(allowAnonymous);
    }
}
