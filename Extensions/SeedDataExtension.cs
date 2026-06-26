using MovieApi.Data;
using MovieApi.Models;




namespace MovieApi.Extensions;

public static class SeedDataExtension
{
    public static void SeedData(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<MovieContext>();
        context.Database.EnsureCreated();

        if (context.Movies.Any()) return;

        var inception = new Movie { Title = "Inception", Year = 2010, Genre = "Sci-Fi", Duration = 148 };
        var matrix = new Movie { Title = "The Matrix", Year = 1999, Genre = "Sci-Fi", Duration = 136 };

        var leo = new Actor { Name = "Leonardo DiCaprio", BirthYear = 1974 };
        var keanu = new Actor { Name = "Keanu Reeves", BirthYear = 1964 };

        context.Movies.AddRange(inception, matrix);
        context.Actors.AddRange(leo, keanu);
        context.SaveChanges();

        context.MovieDetails.AddRange(
            new MovieDetails { MovieId = inception.Id, Synopsis = "A thief enters dreams to steal top secrets.", Language = "English", Budget = 160000000 },
            new MovieDetails { MovieId = matrix.Id, Synopsis = "A hacker discovers that the whole world is a simulation.", Language = "English", Budget = 63000000 });

        context.Reviews.AddRange(
            new Review { MovieId = inception.Id, ReviewerName = "Lilly", Comment = "Smart, intense, mind bending and visually strong.", Rating = 5 },
            new Review { MovieId = matrix.Id, ReviewerName = "Gloria", Comment = "Classic movie with deeper concept of questioning/challenging the reality we live in.", Rating = 5 });

        context.MovieActors.AddRange(
            new MovieActor { MovieId = inception.Id, ActorId = leo.Id, Role = "Dom Cobb" },
            new MovieActor { MovieId = matrix.Id, ActorId = keanu.Id, Role = "Neo" });

        context.SaveChanges();
    }
}
