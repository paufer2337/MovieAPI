using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using MovieApi.Controllers;
using MovieApi.DTOs;
using MovieApi.Services;

namespace MovieAPI.Tests.Controllers;

public class AuthControllerTests
{
    [Fact]
    public void Login_ReturnsToken_WhenCredentialsAreValid()
    {
        var username = $"admin-{Guid.NewGuid():N}";
        var password = $"password-{Guid.NewGuid():N}";
        var request = new LoginRequestDto
        {
            Username = username,
            Password = password
        };
        var response = new LoginResponseDto(
            "header.payload.signature",
            DateTimeOffset.UtcNow.AddMinutes(60));
        var serviceMock = new Mock<IAuthService>();
        serviceMock.Setup(service => service.Login(request.Username, request.Password))
            .Returns(response);
        var controller = new AuthController(serviceMock.Object);

        var result = controller.Login(request);

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Same(response, okResult.Value);
    }

    [Fact]
    public void Login_ReturnsUnauthorized_WhenCredentialsAreInvalid()
    {
        var request = new LoginRequestDto
        {
            Username = $"admin-{Guid.NewGuid():N}",
            Password = $"wrong-{Guid.NewGuid():N}"
        };
        var serviceMock = new Mock<IAuthService>();
        serviceMock.Setup(service => service.Login(request.Username, request.Password))
            .Returns((LoginResponseDto?)null);
        var controller = new AuthController(serviceMock.Object);

        var result = controller.Login(request);

        var unauthorized = Assert.IsType<UnauthorizedObjectResult>(result.Result);
        var problem = Assert.IsType<ProblemDetails>(unauthorized.Value);
        Assert.Equal(StatusCodes.Status401Unauthorized, problem.Status);
        Assert.Equal("Invalid username or password.", problem.Title);
    }
}
