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

        var movies = new List<Movie>
        
        {
            new Movie { Title = "Inception", Year = 2010, Genre = "Sci-Fi", Duration = 148 },
            new Movie { Title = "The Matrix", Year = 1999, Genre = "Sci-Fi", Duration = 136 },
            new Movie { Title = "Braveheart", Year = 1995, Genre = "History/Drama", Duration = 178 },
            new Movie { Title = "Gladiator", Year = 2000, Genre = "Action/Drama", Duration = 155 },
            new Movie { Title = "Troy", Year = 2004, Genre = "History/Action", Duration = 163 },
            new Movie { Title = "Titanic", Year = 1997, Genre = "Romance/Drama", Duration = 195 },
            new Movie { Title = "Avatar", Year = 2009, Genre = "Sci-Fi/Adventure", Duration = 162 },
            new Movie { Title = "Hachi: A Dog's Tale", Year = 2009, Genre = "Drama/Family", Duration = 93 },
            new Movie { Title = "The Pursuit of Happyness", Year = 2006, Genre = "Drama", Duration = 117 },
            new Movie { Title = "Black Beauty", Year = 1994, Genre = "Family/Drama", Duration = 88 },
            new Movie { Title = "Shutter Island", Year = 2010, Genre = "Thriller/Drama", Duration = 138 },
            new Movie { Title = "Spirit: Stallion of the Cimarron", Year = 2002, Genre = "Animation/Adventure", Duration = 83 },
            new Movie { Title = "Brother Bear", Year = 2003, Genre = "Animation/Family", Duration = 85 },
            new Movie { Title = "The Lion King", Year = 1994, Genre = "Animation/Adventure", Duration = 88 },
            new Movie { Title = "The Call of the Wild", Year = 2020, Genre = "Adventure/Drama", Duration = 100 },
            new Movie { Title = "Free Willy", Year = 1993, Genre = "Family/Adventure", Duration = 112 },
            new Movie { Title = "The Last Samurai", Year = 2003, Genre = "Action/Drama", Duration = 154 },
            new Movie { Title = "The Lord of the Rings: The Fellowship of the Ring", Year = 2001, Genre = "Fantasy/Adventure", Duration = 178 },
            new Movie { Title = "The Lord of the Rings: The Two Towers", Year = 2002, Genre = "Fantasy/Adventure", Duration = 179 },
            new Movie { Title = "The Lord of the Rings: The Return of the King", Year = 2003, Genre = "Fantasy/Adventure", Duration = 201 },
            new Movie { Title = "The Hobbit: An Unexpected Journey", Year = 2012, Genre = "Fantasy/Adventure", Duration = 169 },
            new Movie { Title = "The Hobbit: The Desolation of Smaug", Year = 2013, Genre = "Fantasy/Adventure", Duration = 161 },
            new Movie { Title = "The Hobbit: The Battle of the Five Armies", Year = 2014, Genre = "Fantasy/Adventure", Duration = 144 }
        };

        context.Movies.AddRange(movies);
        context.SaveChanges();

        var actors = new List<Actor>
        {
            new Actor { Name = "Leonardo DiCaprio", BirthYear = 1974 },
            new Actor { Name = "Keanu Reeves", BirthYear = 1964 },
            new Actor { Name = "Mel Gibson", BirthYear = 1956 },
            new Actor { Name = "Russell Crowe", BirthYear = 1964 },
            new Actor { Name = "Brad Pitt", BirthYear = 1963 },
            new Actor { Name = "Kate Winslet", BirthYear = 1975 },
            new Actor { Name = "Sam Worthington", BirthYear = 1976 },
            new Actor { Name = "Richard Gere", BirthYear = 1949 },
            new Actor { Name = "Will Smith", BirthYear = 1968 },
            new Actor { Name = "Mackenzie Foy", BirthYear = 2000 },
            new Actor { Name = "Matt Damon", BirthYear = 1970 },
            new Actor { Name = "Tom Cruise", BirthYear = 1962 },
            new Actor { Name = "Ken Watanabe", BirthYear = 1959 },
            new Actor { Name = "Elijah Wood", BirthYear = 1981 },
            new Actor { Name = "Ian McKellen", BirthYear = 1939 },
            new Actor { Name = "Viggo Mortensen", BirthYear = 1958 },
            new Actor { Name = "Martin Freeman", BirthYear = 1971 }
        };

        context.Actors.AddRange(actors);
        context.SaveChanges();

        Movie FindMovie(string title) => movies.First(m => m.Title == title);
        Actor FindActor(string name) => actors.First(a => a.Name == name);

        context.MovieDetails.AddRange(
            new MovieDetails { MovieId = FindMovie("Inception").Id, Synopsis = "A thief enters dreams to steal top secrets.", Language = "English", Budget = 160000000 },
            new MovieDetails { MovieId = FindMovie("The Matrix").Id, Synopsis = "A hacker discovers that the whole world is a simulation.", Language = "English", Budget = 63000000 },
            new MovieDetails { MovieId = FindMovie("Braveheart").Id, Synopsis = "A Scottish warrior leads a rebellion for freedom.", Language = "English", Budget = 72000000 },
            new MovieDetails { MovieId = FindMovie("Gladiator").Id, Synopsis = "A betrayed Roman general seeks justice in the arena.", Language = "English", Budget = 103000000 },
            new MovieDetails { MovieId = FindMovie("Troy").Id, Synopsis = "The legendary war between Troy and Greece.", Language = "English", Budget = 175000000 },
            new MovieDetails { MovieId = FindMovie("Titanic").Id, Synopsis = "A love story unfolds during the tragic sinking of the Titanic.", Language = "English", Budget = 200000000 },
            new MovieDetails { MovieId = FindMovie("Avatar").Id, Synopsis = "A former marine discovers a new world and questions where he belongs.", Language = "English", Budget = 237000000 },
            new MovieDetails { MovieId = FindMovie("Hachi: A Dog's Tale").Id, Synopsis = "A loyal dog waits every day for the owner he loves.", Language = "English", Budget = 16000000 },
            new MovieDetails { MovieId = FindMovie("The Pursuit of Happyness").Id, Synopsis = "A struggling father fights to build a better life for his son.", Language = "English", Budget = 55000000 },
            new MovieDetails { MovieId = FindMovie("Black Beauty").Id, Synopsis = "A horse experiences kindness, hardship and the search for belonging.", Language = "English", Budget = 0 },
            new MovieDetails { MovieId = FindMovie("Shutter Island").Id, Synopsis = "A detective investigates a mysterious disappearance on an isolated island.", Language = "English", Budget = 80000000 },
            new MovieDetails { MovieId = FindMovie("Spirit: Stallion of the Cimarron").Id, Synopsis = "A wild mustang fights to keep his freedom.", Language = "English", Budget = 80000000 },
            new MovieDetails { MovieId = FindMovie("Brother Bear").Id, Synopsis = "A young man is transformed into a bear and learns compassion.", Language = "English", Budget = 46000000 },
            new MovieDetails { MovieId = FindMovie("The Lion King").Id, Synopsis = "A young lion prince must face loss, identity and responsibility.", Language = "English", Budget = 45000000 },
            new MovieDetails { MovieId = FindMovie("The Call of the Wild").Id, Synopsis = "A dog discovers his strength and wild nature in the Yukon.", Language = "English", Budget = 135000000 },
            new MovieDetails { MovieId = FindMovie("Free Willy").Id, Synopsis = "A boy forms a bond with an orca and helps him return to freedom.", Language = "English", Budget = 20000000 },
            new MovieDetails { MovieId = FindMovie("The Last Samurai").Id, Synopsis = "A soldier finds honor, discipline and meaning among samurai warriors.", Language = "English", Budget = 140000000 },
            new MovieDetails { MovieId = FindMovie("The Lord of the Rings: The Fellowship of the Ring").Id, Synopsis = "A young hobbit begins a dangerous journey to destroy a powerful ring.", Language = "English", Budget = 93000000 },
            new MovieDetails { MovieId = FindMovie("The Lord of the Rings: The Two Towers").Id, Synopsis = "The fellowship is divided while the battle for Middle-earth grows.", Language = "English", Budget = 94000000 },
            new MovieDetails { MovieId = FindMovie("The Lord of the Rings: The Return of the King").Id, Synopsis = "The final battle for Middle-earth begins.", Language = "English", Budget = 94000000 },
            new MovieDetails { MovieId = FindMovie("The Hobbit: An Unexpected Journey").Id, Synopsis = "Bilbo Baggins joins a company of dwarves on an unexpected adventure.", Language = "English", Budget = 180000000 },
            new MovieDetails { MovieId = FindMovie("The Hobbit: The Desolation of Smaug").Id, Synopsis = "Bilbo and the dwarves continue their quest toward the Lonely Mountain.", Language = "English", Budget = 217000000 },
            new MovieDetails { MovieId = FindMovie("The Hobbit: The Battle of the Five Armies").Id, Synopsis = "The final battle for the Lonely Mountain begins.", Language = "English", Budget = 250000000 }
        );

        context.Reviews.AddRange(
            new Review { MovieId = FindMovie("Inception").Id, ReviewerName = "Lilly", Comment = "Smart, intense, mind bending and visually strong.", Rating = 5 },
            new Review { MovieId = FindMovie("The Matrix").Id, ReviewerName = "Gloria", Comment = "Classic movie with deeper concept of questioning/challenging the reality we live in.", Rating = 5 },
            new Review { MovieId = FindMovie("Braveheart").Id, ReviewerName = "Paulina", Comment = "Powerful, emotional and full of courage.", Rating = 5 },
            new Review { MovieId = FindMovie("Gladiator").Id, ReviewerName = "Paulina", Comment = "Epic, emotional and unforgettable.", Rating = 5 },
            new Review { MovieId = FindMovie("Troy").Id, ReviewerName = "Paulina", Comment = "A dramatic and visually strong historical epic.", Rating = 4 },
            new Review { MovieId = FindMovie("Titanic").Id, ReviewerName = "Paulina", Comment = "Romantic, tragic and iconic.", Rating = 5 },
            new Review { MovieId = FindMovie("Avatar").Id, ReviewerName = "Paulina", Comment = "Beautiful world-building with nature, loyalty and purpose.", Rating = 5 },
            new Review { MovieId = FindMovie("Hachi: A Dog's Tale").Id, ReviewerName = "Paulina", Comment = "Heartbreaking and deeply loyal.", Rating = 5 },
            new Review { MovieId = FindMovie("The Pursuit of Happyness").Id, ReviewerName = "Paulina", Comment = "Inspiring, painful and full of perseverance.", Rating = 5 },
            new Review { MovieId = FindMovie("Spirit: Stallion of the Cimarron").Id, ReviewerName = "Paulina", Comment = "Freedom, spirit and emotion. One of the strongest animated films.", Rating = 5 },
            new Review { MovieId = FindMovie("The Last Samurai").Id, ReviewerName = "Paulina", Comment = "Beautiful, honorable and deeply moving.", Rating = 5 },
            new Review { MovieId = FindMovie("The Lord of the Rings: The Fellowship of the Ring").Id, ReviewerName = "Paulina", Comment = "A masterpiece about courage, friendship and sacrifice.", Rating = 5 }
        );

        context.MovieActors.AddRange(
            new MovieActor { MovieId = FindMovie("Inception").Id, ActorId = FindActor("Leonardo DiCaprio").Id, Role = "Dom Cobb" },
            new MovieActor { MovieId = FindMovie("The Matrix").Id, ActorId = FindActor("Keanu Reeves").Id, Role = "Neo" },
            new MovieActor { MovieId = FindMovie("Braveheart").Id, ActorId = FindActor("Mel Gibson").Id, Role = "William Wallace" },
            new MovieActor { MovieId = FindMovie("Gladiator").Id, ActorId = FindActor("Russell Crowe").Id, Role = "Maximus" },
            new MovieActor { MovieId = FindMovie("Troy").Id, ActorId = FindActor("Brad Pitt").Id, Role = "Achilles" },
            new MovieActor { MovieId = FindMovie("Titanic").Id, ActorId = FindActor("Leonardo DiCaprio").Id, Role = "Jack Dawson" },
            new MovieActor { MovieId = FindMovie("Titanic").Id, ActorId = FindActor("Kate Winslet").Id, Role = "Rose DeWitt Bukater" },
            new MovieActor { MovieId = FindMovie("Avatar").Id, ActorId = FindActor("Sam Worthington").Id, Role = "Jake Sully" },
            new MovieActor { MovieId = FindMovie("Hachi: A Dog's Tale").Id, ActorId = FindActor("Richard Gere").Id, Role = "Parker Wilson" },
            new MovieActor { MovieId = FindMovie("The Pursuit of Happyness").Id, ActorId = FindActor("Will Smith").Id, Role = "Chris Gardner" },
            new MovieActor { MovieId = FindMovie("Black Beauty").Id, ActorId = FindActor("Mackenzie Foy").Id, Role = "Jo Green" },
            new MovieActor { MovieId = FindMovie("The Last Samurai").Id, ActorId = FindActor("Tom Cruise").Id, Role = "Nathan Algren" },
            new MovieActor { MovieId = FindMovie("The Last Samurai").Id, ActorId = FindActor("Ken Watanabe").Id, Role = "Katsumoto" },
            new MovieActor { MovieId = FindMovie("The Lord of the Rings: The Fellowship of the Ring").Id, ActorId = FindActor("Elijah Wood").Id, Role = "Frodo Baggins" },
            new MovieActor { MovieId = FindMovie("The Lord of the Rings: The Fellowship of the Ring").Id, ActorId = FindActor("Ian McKellen").Id, Role = "Gandalf" },
            new MovieActor { MovieId = FindMovie("The Lord of the Rings: The Fellowship of the Ring").Id, ActorId = FindActor("Viggo Mortensen").Id, Role = "Aragorn" },
            new MovieActor { MovieId = FindMovie("The Hobbit: An Unexpected Journey").Id, ActorId = FindActor("Martin Freeman").Id, Role = "Bilbo Baggins" },
            new MovieActor { MovieId = FindMovie("The Hobbit: An Unexpected Journey").Id, ActorId = FindActor("Ian McKellen").Id, Role = "Gandalf" }
        );

        context.SaveChanges();
    }
}