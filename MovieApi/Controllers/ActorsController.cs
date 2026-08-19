using Microsoft.AspNetCore.Mvc;
using MovieApi.DTOs;
using MovieApi.Services;

namespace MovieApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ActorsController : ControllerBase
{
    private readonly IMovieService _service;

    public ActorsController(IMovieService service) => _service = service;

    [HttpGet]
    public async Task<ActionResult<List<ActorDto>>> GetActors()
    {
        var actors = await _service.GetActorsAsync();
        return Ok(actors);
    }
}
