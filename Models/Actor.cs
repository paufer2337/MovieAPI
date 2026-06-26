namespace MovieApi.Models;

public class Actor
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int BirthYear { get; set; }
    public List<MovieActor> MovieActors { get; set; } = new();
}
