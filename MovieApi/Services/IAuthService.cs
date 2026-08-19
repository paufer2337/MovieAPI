using MovieApi.DTOs;

namespace MovieApi.Services;

public interface IAuthService
{
    LoginResponseDto? Login(string username, string password);
}
