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

    [HttpGet("{id}/reviews")]
    public async Task<ActionResult<List<ReviewDto>>> GetReviews(int id)
    {
        var reviews = await _service.GetReviewsAsync(id);
        return reviews is null ? NotFound() : Ok(reviews);
    }

    [HttpPost]
    public async Task<ActionResult<MovieDto>> CreateMovie(MovieCreateDto dto)
    {
        var created = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetMovie), new { id = created.Id }, created);
    }

    [HttpPost("{id}/reviews")]
    public async Task<ActionResult<ReviewDto>> CreateReview(int id, ReviewCreateDto dto)
    {
        var created = await _service.CreateReviewAsync(id, dto);
        return created is null
            ? NotFound()
            : CreatedAtAction(nameof(GetMovieDetails), new { id }, created);
    }

    [HttpPost("{movieId:int}/actors/{actorId:int}")]
    public async Task<ActionResult<ActorDto>> AddActor(
        int movieId,
        int actorId,
        MovieActorCreateDto dto)
    {
        ValidateMovieActorRequest(movieId, actorId, dto);
        if (!ModelState.IsValid) return InvalidMovieActorRequest();

        dto.Role = dto.Role.Trim();
        var result = await _service.AddActorAsync(movieId, actorId, dto);

        return result.Status switch
        {
            AddMovieActorStatus.Created => CreatedAtAction(
                nameof(GetMovieDetails),
                new { id = movieId },
                result.Actor),
            AddMovieActorStatus.MovieNotFound => NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Movie not found."
            }),
            AddMovieActorStatus.ActorNotFound => NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Actor not found."
            }),
            AddMovieActorStatus.Duplicate => Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "The actor is already linked to this movie."
            }),
            _ => InvalidMovieActorRequest()
        };
    }

    [HttpDelete("{id}/reviews/{reviewId}")]
    public async Task<IActionResult> DeleteReview(int id, int reviewId)
        => await _service.DeleteReviewAsync(id, reviewId) ? NoContent() : NotFound();

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateMovie(int id, MovieUpdateDto dto)
        => await _service.UpdateAsync(id, dto) ? NoContent() : NotFound();

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMovie(int id)
        => await _service.DeleteAsync(id) ? NoContent() : NotFound();

    private void ValidateMovieActorRequest(
        int movieId,
        int actorId,
        MovieActorCreateDto dto)
    {
        if (movieId <= 0)
        {
            ModelState.AddModelError(nameof(movieId), "A valid movie id is required.");
        }

        if (actorId <= 0)
        {
            ModelState.AddModelError(nameof(actorId), "A valid actor id is required.");
        }

        var role = dto.Role?.Trim();
        if (string.IsNullOrWhiteSpace(role))
        {
            ModelState.AddModelError(nameof(dto.Role), "Role must be specified.");
        }
        else if (role.Length is < 2 or > 100)
        {
            ModelState.AddModelError(
                nameof(dto.Role),
                "Role must be between 2 and 100 characters.");
        }
    }

    private BadRequestObjectResult InvalidMovieActorRequest() =>
        BadRequest(new ValidationProblemDetails(ModelState)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "One or more validation errors occurred."
        });
}
