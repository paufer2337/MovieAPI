using System.ComponentModel.DataAnnotations;

namespace MovieApi.DTOs;

public sealed class LoginRequestDto
{
    [Required(ErrorMessage = "Username is required.")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required.")]
    public string Password { get; set; } = string.Empty;
}

public sealed record LoginResponseDto(string Token, DateTimeOffset ExpiresAtUtc);
