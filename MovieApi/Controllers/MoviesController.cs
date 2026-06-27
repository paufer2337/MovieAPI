using Microsoft.AspNetCore.Mvc;
using MovieApi.DTOs;
using MovieApi.Services;




namespace MovieApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MoviesController : ControllerBase
{
    private readonly IMovieService _service;
    public MoviesController(IMovieService service) => _service = service;


    /// <summary>
    /// Gets movies with optional filtering, searching, sorting and pagination.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<MovieDto>>> GetMovies(
        [FromQuery] string? genre, 
        [FromQuery] int? year, 
        [FromQuery] string? search,
        [FromQuery] string? sortBy, 
        [FromQuery] bool descending = false, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10)
    {
        var movies = await _service.GetAllAsync(genre, year, search, sortBy, descending, page, pageSize);
        return Ok(movies);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<MovieDto>> GetMovie(int id)
    {
        var movie = await _service.GetByIdAsync(id);
        return movie is null ? NotFound() : Ok(movie);
    }

    [HttpGet("{id}/details")]
    public async Task<ActionResult<MovieDetailDto>> GetMovieDetails(int id)
    {
        var movie = await _service.GetDetailsAsync(id);
        return movie is null ? NotFound() : Ok(movie);
    }

    [HttpPost]
    public async Task<ActionResult<MovieDto>> CreateMovie(MovieCreateDto dto)
    {
        var created = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetMovie), new { id = created.Id }, created);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMovie(int id, MovieUpdateDto dto)
        => await _service.UpdateAsync(id, dto) ? NoContent() : NotFound();

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMovie(int id)
        => await _service.DeleteAsync(id) ? NoContent() : NotFound();
}
