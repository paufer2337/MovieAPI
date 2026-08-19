using System.Reflection;
using Microsoft.AspNetCore.Authorization;
using MovieApi.Controllers;

namespace MovieAPI.Tests.Controllers;

public class AuthorizationAttributeTests
{
    [Theory]
    [InlineData(nameof(MoviesController.CreateMovie))]
    [InlineData(nameof(MoviesController.UpdateMovie))]
    [InlineData(nameof(MoviesController.DeleteMovie))]
    [InlineData(nameof(MoviesController.AddActor))]
    [InlineData(nameof(MoviesController.DeleteReview))]
    public void AdminMutationEndpoint_RequiresAdminRole(string methodName)
    {
        var method = GetMovieControllerMethod(methodName);

        var authorize = Assert.Single(
            method.GetCustomAttributes<AuthorizeAttribute>());
        Assert.Equal("Admin", authorize.Roles);
    }

    [Theory]
    [InlineData(nameof(MoviesController.GetMovies))]
    [InlineData(nameof(MoviesController.GetMovie))]
    [InlineData(nameof(MoviesController.GetMovieDetails))]
    [InlineData(nameof(MoviesController.GetReviews))]
    [InlineData(nameof(MoviesController.CreateReview))]
    public void PublicMovieEndpoint_DoesNotRequireAuthorization(string methodName)
    {
        var method = GetMovieControllerMethod(methodName);

        Assert.Empty(method.GetCustomAttributes<AuthorizeAttribute>());
    }

    [Fact]
    public void GetActors_DoesNotRequireAuthorization()
    {
        var method = typeof(ActorsController).GetMethod(
            nameof(ActorsController.GetActors),
            BindingFlags.Instance | BindingFlags.Public);

        Assert.NotNull(method);
        Assert.Empty(method.GetCustomAttributes<AuthorizeAttribute>());
    }

    private static MethodInfo GetMovieControllerMethod(string methodName) =>
        Assert.Single(
            typeof(MoviesController).GetMethods(
                BindingFlags.Instance | BindingFlags.Public),
            method => method.Name == methodName);
}
