using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MovieApi.DTOs;
using MovieApi.Services;

namespace MovieApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService) => _authService = authService;

    [HttpPost("login")]
    [AllowAnonymous]
    public ActionResult<LoginResponseDto> Login(LoginRequestDto request)
    {
        var response = _authService.Login(request.Username, request.Password);

        return response is null
            ? Unauthorized(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Invalid username or password."
            })
            : Ok(response);
    }
}
