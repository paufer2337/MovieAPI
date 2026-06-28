using System.ComponentModel.DataAnnotations;





namespace MovieApi.DTOs;

public record MovieDto(int Id, string Title, int Year, string Genre, int Duration);
public record ReviewDto(int Id, string ReviewerName, string Comment, int Rating);
public record ActorDto(int Id, string Name, int BirthYear, string Role);
public record MovieDetailsDto(string Synopsis, string Language, decimal Budget);

public record MovieDetailDto(
    int Id,
    string Title,
    int Year,
    string Genre,
    int Duration,
    MovieDetailsDto? Details,
    List<ReviewDto> Reviews,
    List<ActorDto> Actors);

public class MovieCreateDto
{
    [Required(ErrorMessage = "Movie title is required.")]
    [StringLength(120, MinimumLength = 2,
    ErrorMessage = "Title must be between 2 and 120 characters.")] 
    public string Title { get; set; } = string.Empty;
    

    [Range(1888, 2100, ErrorMessage = "Year must be between 1888 and 2100.")] 
    public int Year { get; set; }


    [Required(ErrorMessage = "Genre is required.")] 
    public string Genre { get; set; } = string.Empty;


    [Range(1, 600, ErrorMessage = "Duration must be between 1 and 600.")] 
    public int Duration { get; set; }
}

public class MovieUpdateDto : MovieCreateDto { }

public class ReviewCreateDto
{
    [Required(ErrorMessage = "Reviewer name is required.")] 
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Reviewer name must be between 2 and 100 characters.")]
    public string ReviewerName { get; set; } = string.Empty;


    [Required(ErrorMessage = "Comment is required.")] 
    [StringLength(200, MinimumLength = 10, ErrorMessage = "Comment must be between 10 and 200 characters.")]
    public string Comment { get; set; } = string.Empty;

    [Range(1, 5, ErrorMessage = "Rating must be between 1 and 5.")] 
    public int Rating { get; set; }
}

public class MovieActorCreateDto
{
    [Required(ErrorMessage = "Actor is required.")] 
    [Range(1, int.MaxValue, ErrorMessage = "A valid actor is required.")]
    public int ActorId { get; set; }


    [Required(ErrorMessage = "Role must be specified.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Role must be between 2 and 100 characters.")] 
    public string Role { get; set; } = string.Empty;
}
