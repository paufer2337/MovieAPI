using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using MovieApi.DTOs;
using MovieApi.Options;

namespace MovieApi.Services;

public sealed class AuthService : IAuthService
{
    private readonly JwtOptions _options;

    public AuthService(JwtOptions options) => _options = options;

    public LoginResponseDto? Login(string username, string password)
    {
        if (!SecureEquals(username, _options.AdminUsername) ||
            !SecureEquals(password, _options.AdminPassword))
        {
            return null;
        }

        var now = DateTimeOffset.UtcNow;
        var expiresAtUtc = now.AddMinutes(_options.AccessTokenMinutes);
        var claims = new[]
        {
            new Claim(ClaimTypes.Name, _options.AdminUsername),
            new Claim(ClaimTypes.Role, "Admin")
        };
        var signingKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_options.Key));
        var credentials = new SigningCredentials(
            signingKey,
            SecurityAlgorithms.HmacSha256Signature);
        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: now.UtcDateTime,
            expires: expiresAtUtc.UtcDateTime,
            signingCredentials: credentials);

        return new LoginResponseDto(
            new JwtSecurityTokenHandler().WriteToken(token),
            expiresAtUtc);
    }

    private static bool SecureEquals(string provided, string expected)
    {
        var providedHash = SHA256.HashData(Encoding.UTF8.GetBytes(provided));
        var expectedHash = SHA256.HashData(Encoding.UTF8.GetBytes(expected));
        return CryptographicOperations.FixedTimeEquals(providedHash, expectedHash);
    }
}
