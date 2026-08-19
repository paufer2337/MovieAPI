using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Data.Sqlite;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using MovieApi.DTOs;
using MovieApi.Options;
using MovieAPI.Tests.Services;

namespace MovieAPI.Tests;

public class AuthenticationIntegrationTests :
    IClassFixture<JwtWebApplicationFactory>
{
    private readonly JwtWebApplicationFactory _factory;

    public AuthenticationIntegrationTests(JwtWebApplicationFactory factory) =>
        _factory = factory;

    [Fact]
    public async Task Login_ReturnsJwt_ForConfiguredAdminCredentials()
    {
        using var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequestDto
            {
                Username = _factory.Options.AdminUsername,
                Password = _factory.Options.AdminPassword
            });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var login = await response.Content.ReadFromJsonAsync<LoginResponseDto>();
        Assert.NotNull(login);
        Assert.False(string.IsNullOrWhiteSpace(login.Token));
    }

    [Fact]
    public async Task Login_ReturnsUnauthorized_ForInvalidCredentials()
    {
        using var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequestDto
            {
                Username = _factory.Options.AdminUsername,
                Password = $"wrong-{Guid.NewGuid():N}"
            });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Theory]
    [InlineData("POST", "/api/movies")]
    [InlineData("PUT", "/api/movies/1")]
    [InlineData("DELETE", "/api/movies/1")]
    [InlineData("POST", "/api/movies/1/actors/1")]
    [InlineData("DELETE", "/api/movies/1/reviews/1")]
    public async Task AdminEndpoint_ReturnsUnauthorized_WithoutToken(
        string method,
        string path)
    {
        using var client = _factory.CreateClient();
        using var request = CreateRequest(method, path);

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AdminEndpoint_ReturnsForbidden_ForNonAdminRole()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            CreateToken("viewer", "User"));

        var response = await client.PostAsJsonAsync("/api/movies", new { });

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task AdminEndpoint_ReturnsUnauthorized_ForInvalidToken()
    {
        using var client = _factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            "not-a-jwt");

        var response = await client.PostAsJsonAsync("/api/movies", new { });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task AdminEndpoint_AcceptsAdminRole()
    {
        using var client = _factory.CreateClient();
        var loginResponse = await client.PostAsJsonAsync(
            "/api/auth/login",
            new LoginRequestDto
            {
                Username = _factory.Options.AdminUsername,
                Password = _factory.Options.AdminPassword
            });
        var login = await loginResponse.Content.ReadFromJsonAsync<LoginResponseDto>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            login!.Token);

        var response = await client.PostAsJsonAsync("/api/movies", new { });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    private string CreateToken(string username, string role)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, username),
            new Claim(ClaimTypes.Role, role)
        };
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_factory.Options.Key)),
            SecurityAlgorithms.HmacSha256Signature);
        var token = new JwtSecurityToken(
            _factory.Options.Issuer,
            _factory.Options.Audience,
            claims,
            expires: DateTime.UtcNow.AddMinutes(5),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static HttpRequestMessage CreateRequest(string method, string path)
    {
        var request = new HttpRequestMessage(new HttpMethod(method), path);
        if (method is "POST" or "PUT") request.Content = JsonContent.Create(new { });
        return request;
    }
}

public sealed class JwtWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly SqliteConnection _databaseConnection = new(
        $"Data Source=movie-api-jwt-tests-{Guid.NewGuid():N};Mode=Memory;Cache=Shared");

    public JwtOptions Options { get; } = AuthServiceTests.CreateOptions(
        adminUsername: $"test-admin-{Guid.NewGuid():N}",
        adminPassword: $"test-password-{Guid.NewGuid():N}");

    public JwtWebApplicationFactory() => _databaseConnection.Open();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Jwt:Issuer"] = Options.Issuer,
                ["Jwt:Audience"] = Options.Audience,
                ["Jwt:Key"] = Options.Key,
                ["Jwt:AdminUsername"] = Options.AdminUsername,
                ["Jwt:AdminPassword"] = Options.AdminPassword,
                ["Jwt:AccessTokenMinutes"] = Options.AccessTokenMinutes.ToString(),
                ["ConnectionStrings:DefaultConnection"] = _databaseConnection.ConnectionString
            });
        });
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        if (disposing) _databaseConnection.Dispose();
    }
}
