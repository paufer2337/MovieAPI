using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MovieApi.DTOs;
using MovieApi.Services;

namespace MovieApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[AllowAnonymous]
public sealed class ReportsController : ControllerBase
{
    private readonly IReportsService _service;

    public ReportsController(IReportsService service) => _service = service;

    [HttpGet("top-movies-by-genre")]
    public async Task<ActionResult<List<TopMoviesByGenreDto>>> GetTopMoviesByGenre() =>
        Ok(await _service.GetTopMoviesByGenreAsync());

    [HttpGet("average-ratings")]
    public async Task<ActionResult<List<MovieAverageRatingDto>>> GetAverageRatings() =>
        Ok(await _service.GetAverageRatingsAsync());

    [HttpGet("most-active-actors")]
    public async Task<ActionResult<List<ActiveActorDto>>> GetMostActiveActors() =>
        Ok(await _service.GetMostActiveActorsAsync());
}
