namespace MovieApi.Models;

public class Movie
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public int Year { get; set; }
    public string Genre { get; set; } = string.Empty;
    public int Duration { get; set; }

    public MovieDetails? MovieDetails { get; set; }
    public List<Review> Reviews { get; set; } = new();
    public List<MovieActor> MovieActors { get; set; } = new();
}
