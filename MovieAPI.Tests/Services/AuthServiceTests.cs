using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using MovieApi.Options;
using MovieApi.Services;

namespace MovieAPI.Tests.Services;

public class AuthServiceTests
{
    [Fact]
    public void Login_CreatesSignedToken_WithNameAdminRoleAndLimitedLifetime()
    {
        var options = CreateOptions();
        var service = new AuthService(options);

        var result = service.Login(options.AdminUsername, options.AdminPassword);

        Assert.NotNull(result);
        var handler = new JwtSecurityTokenHandler();
        var principal = handler.ValidateToken(
            result.Token,
            CreateValidationParameters(options),
            out var validatedToken);
        var jwt = Assert.IsType<JwtSecurityToken>(validatedToken);
        Assert.Equal(options.AdminUsername, principal.Identity?.Name);
        Assert.True(principal.IsInRole("Admin"));
        Assert.Equal(options.Issuer, jwt.Issuer);
        Assert.Contains(options.Audience, jwt.Audiences);
        Assert.InRange(
            result.ExpiresAtUtc - DateTimeOffset.UtcNow,
            TimeSpan.FromMinutes(59),
            TimeSpan.FromMinutes(60));
    }

    [Fact]
    public void Login_ReturnsNull_WhenCredentialsAreInvalid()
    {
        var options = CreateOptions();
        var service = new AuthService(options);

        var wrongUsername = service.Login(
            $"wrong-{Guid.NewGuid():N}",
            options.AdminPassword);
        var wrongPassword = service.Login(
            options.AdminUsername,
            $"wrong-{Guid.NewGuid():N}");

        Assert.Null(wrongUsername);
        Assert.Null(wrongPassword);
    }

    [Fact]
    public void JwtOptionsValidator_ReportsMissingSecretsClearly()
    {
        var options = new JwtOptions
        {
            Issuer = "MovieApi",
            Audience = "MovieApiClient",
            AdminUsername = "admin",
            AccessTokenMinutes = 60
        };

        var result = new JwtOptionsValidator().Validate(null, options);

        Assert.True(result.Failed);
        Assert.Contains(result.Failures, failure => failure.Contains("Jwt:Key is required."));
        Assert.Contains(
            result.Failures,
            failure => failure.Contains("Jwt:AdminPassword is required."));
        Assert.All(result.Failures, failure => Assert.Contains("user-secrets", failure));
    }

    internal static JwtOptions CreateOptions(
        string? adminUsername = null,
        string? adminPassword = null) =>
        new()
        {
            Issuer = "MovieApi.Tests",
            Audience = "MovieApi.Tests.Client",
            Key = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48)),
            AdminUsername = adminUsername ?? $"test-admin-{Guid.NewGuid():N}",
            AdminPassword = adminPassword ?? $"test-password-{Guid.NewGuid():N}",
            AccessTokenMinutes = 60
        };

    internal static TokenValidationParameters CreateValidationParameters(
        JwtOptions options) =>
        new()
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(options.Key)),
            ValidateIssuer = true,
            ValidIssuer = options.Issuer,
            ValidateAudience = true,
            ValidAudience = options.Audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
}
