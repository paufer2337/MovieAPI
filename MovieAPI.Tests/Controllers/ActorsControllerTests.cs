using Microsoft.AspNetCore.Mvc;
using Moq;
using MovieApi.Controllers;
using MovieApi.DTOs;
using MovieApi.Services;

namespace MovieAPI.Tests.Controllers;

public class ActorsControllerTests
{
    [Fact]
    public async Task GetActors_ReturnsAllActors()
    {
        var actors = new List<ActorDto>
        {
            new(1, "Actor One", 1970, string.Empty),
            new(2, "Actor Two", 1980, string.Empty)
        };
        var serviceMock = new Mock<IMovieService>();
        serviceMock.Setup(service => service.GetActorsAsync()).ReturnsAsync(actors);
        var controller = new ActorsController(serviceMock.Object);

        var result = await controller.GetActors();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(actors, okResult.Value);
        serviceMock.Verify(service => service.GetActorsAsync(), Times.Once);
    }
}
