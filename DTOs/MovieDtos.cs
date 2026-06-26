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
    [Required, StringLength(120)] public string Title { get; set; } = string.Empty;
    [Range(1888, 2100)] public int Year { get; set; }
    [Required] public string Genre { get; set; } = string.Empty;
    [Range(1, 600)] public int Duration { get; set; }
}

public class MovieUpdateDto : MovieCreateDto { }

public class ReviewCreateDto
{
    [Required] public string ReviewerName { get; set; } = string.Empty;
    [Required] public string Comment { get; set; } = string.Empty;
    [Range(1, 5)] public int Rating { get; set; }
}

public class MovieActorCreateDto
{
    [Required] public int ActorId { get; set; }
    [Required] public string Role { get; set; } = string.Empty;
}
