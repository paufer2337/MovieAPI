using Microsoft.EntityFrameworkCore;
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

        SeedData(context);
    }

    public static void SeedData(MovieContext context)
    {

        if (context.Movies.Any())
        {
            SeedStudioGhibliMovies(context);
            SeedAdditionalAnimeMovies(context);
            EnrichSeededCatalog(context);
            return;
        }

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

        var actorSeeds = new List<Actor>
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
            new Actor { Name = "Matt Damon", BirthYear = 1970 },
            new Actor { Name = "Tom Cruise", BirthYear = 1962 },
            new Actor { Name = "Ken Watanabe", BirthYear = 1959 },
            new Actor { Name = "Elijah Wood", BirthYear = 1981 },
            new Actor { Name = "Ian McKellen", BirthYear = 1939 },
            new Actor { Name = "Viggo Mortensen", BirthYear = 1958 },
            new Actor { Name = "Martin Freeman", BirthYear = 1971 }
        };

        var baseActorNames = actorSeeds.Select(actor => actor.Name).ToArray();
        var existingBaseActorNames = context.Actors
            .Where(actor => baseActorNames.Contains(actor.Name))
            .Select(actor => actor.Name)
            .ToHashSet(StringComparer.Ordinal);
        context.Actors.AddRange(actorSeeds.Where(actor =>
            !existingBaseActorNames.Contains(actor.Name)));
        context.SaveChanges();

        var actors = context.Actors
            .Where(actor => baseActorNames.Contains(actor.Name))
            .AsEnumerable()
            .GroupBy(actor => actor.Name, StringComparer.Ordinal)
            .Select(group => group.First())
            .ToList();

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
            new MovieActor { MovieId = FindMovie("The Last Samurai").Id, ActorId = FindActor("Tom Cruise").Id, Role = "Nathan Algren" },
            new MovieActor { MovieId = FindMovie("The Last Samurai").Id, ActorId = FindActor("Ken Watanabe").Id, Role = "Katsumoto" },
            new MovieActor { MovieId = FindMovie("The Lord of the Rings: The Fellowship of the Ring").Id, ActorId = FindActor("Elijah Wood").Id, Role = "Frodo Baggins" },
            new MovieActor { MovieId = FindMovie("The Lord of the Rings: The Fellowship of the Ring").Id, ActorId = FindActor("Ian McKellen").Id, Role = "Gandalf" },
            new MovieActor { MovieId = FindMovie("The Lord of the Rings: The Fellowship of the Ring").Id, ActorId = FindActor("Viggo Mortensen").Id, Role = "Aragorn" },
            new MovieActor { MovieId = FindMovie("The Hobbit: An Unexpected Journey").Id, ActorId = FindActor("Martin Freeman").Id, Role = "Bilbo Baggins" },
            new MovieActor { MovieId = FindMovie("The Hobbit: An Unexpected Journey").Id, ActorId = FindActor("Ian McKellen").Id, Role = "Gandalf" }
        );

        context.SaveChanges();
        SeedStudioGhibliMovies(context);
        SeedAdditionalAnimeMovies(context);
        EnrichSeededCatalog(context);
    }

    private static void SeedStudioGhibliMovies(MovieContext context)
    {
        var movieSeeds = new[]
        {
            new { Title = "My Neighbor Totoro", Year = 1988, Duration = 86, Synopsis = "Two sisters discover friendly forest spirits near their new home." },
            new { Title = "Princess Mononoke", Year = 1997, Duration = 133, Synopsis = "A young warrior is caught between humans and the gods of the forest." },
            new { Title = "Howl's Moving Castle", Year = 2004, Duration = 119, Synopsis = "A young woman under a curse seeks help from a mysterious wizard." },
            new { Title = "Spirited Away", Year = 2001, Duration = 125, Synopsis = "A girl enters a spirit world and must save her transformed parents." }
        };

        var titles = movieSeeds.Select(seed => seed.Title).ToArray();
        var existingMovies = context.Movies
            .Where(movie => titles.Contains(movie.Title))
            .AsEnumerable()
            .GroupBy(movie => movie.Title, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        foreach (var seed in movieSeeds)
        {
            if (!existingMovies.TryGetValue(seed.Title, out var movie))
            {
                movie = new Movie
                {
                    Title = seed.Title,
                    Year = seed.Year,
                    Genre = "Anime",
                    Duration = seed.Duration
                };

                context.Movies.Add(movie);
            }

            if (movie.Id == 0 || !context.MovieDetails.Any(details => details.MovieId == movie.Id))
            {
                context.MovieDetails.Add(new MovieDetails
                {
                    Movie = movie,
                    Synopsis = seed.Synopsis,
                    Language = "Japanese",
                    Budget = 0
                });
            }
        }

        context.SaveChanges();
    }

    private static void SeedAdditionalAnimeMovies(MovieContext context)
    {
        var movieSeeds = new[]
        {
            new
            {
                Title = "The Cat Returns",
                Year = 2002,
                Genre = "Anime/Adventure/Fantasy",
                Duration = 75,
                Synopsis = "After saving a mysterious cat from being hit by a truck, shy high-school student Haru is swept into the Cat Kingdom and promised in marriage to its prince. With help from the elegant Baron, Muta and Toto, she must escape before she loses herself and becomes a cat forever.",
                Budget = 20000000m,
                ReviewRating = 4,
                ReviewComment = "A playful and imaginative adventure with warmth, humor and one of Studio Ghibli's most charming fantasy worlds.",
                Actors = new[]
                {
                    new { Name = "Chizuru Ikewaki", Role = "Haru Yoshioka" },
                    new { Name = "Yoshihiko Hakamada", Role = "Baron Humbert von Gikkingen" },
                    new { Name = "Tetsu Watanabe", Role = "Muta" },
                    new { Name = "Yōsuke Saitō", Role = "Toto" },
                    new { Name = "Tetsurō Tamba", Role = "The Cat King" },
                    new { Name = "Aki Maeda", Role = "Yuki" },
                    new { Name = "Takayuki Yamada", Role = "Prince Lune" }
                }
            },
            new
            {
                Title = "Wolf Children",
                Year = 2012,
                Genre = "Anime/Drama/Fantasy",
                Duration = 117,
                Synopsis = "After falling in love with a man who can transform into a wolf, Hana becomes the mother of two extraordinary children, Yuki and Ame. When she must raise them alone, the family moves to the countryside, where each child gradually chooses between a human life and the call of the wild.",
                Budget = 0m,
                ReviewRating = 5,
                ReviewComment = "A tender and beautifully observed story about parenthood, identity and allowing children to find their own paths.",
                Actors = new[]
                {
                    new { Name = "Aoi Miyazaki", Role = "Hana" },
                    new { Name = "Takao Osawa", Role = "Wolf Man" },
                    new { Name = "Haru Kuroki", Role = "Yuki" },
                    new { Name = "Momoka Ono", Role = "Young Yuki" },
                    new { Name = "Yukito Nishii", Role = "Ame" },
                    new { Name = "Amon Kabe", Role = "Young Ame" },
                    new { Name = "Takuma Hiraoka", Role = "Sōhei Fujii" }
                }
            },
            new
            {
                Title = "Demon Slayer -Kimetsu no Yaiba- The Movie: Mugen Train",
                Year = 2020,
                Genre = "Anime/Action/Fantasy",
                Duration = 117,
                Synopsis = "Tanjiro, Nezuko, Zenitsu and Inosuke board the Mugen Train to assist Flame Hashira Kyojuro Rengoku in investigating a series of disappearances. Their mission becomes a deadly battle when the passengers are trapped inside dreams created by a powerful demon.",
                Budget = 0m,
                ReviewRating = 5,
                ReviewComment = "A visually spectacular and emotional continuation that combines intense action with an unforgettable performance from Kyojuro Rengoku.",
                Actors = new[]
                {
                    new { Name = "Natsuki Hanae", Role = "Tanjiro Kamado" },
                    new { Name = "Akari Kitō", Role = "Nezuko Kamado" },
                    new { Name = "Hiro Shimono", Role = "Zenitsu Agatsuma" },
                    new { Name = "Yoshitsugu Matsuoka", Role = "Inosuke Hashibira" },
                    new { Name = "Satoshi Hino", Role = "Kyojuro Rengoku" },
                    new { Name = "Daisuke Hirakawa", Role = "Enmu" },
                    new { Name = "Akira Ishida", Role = "Akaza" }
                }
            }
        };

        var titles = movieSeeds.Select(seed => seed.Title).ToArray();
        var actorNames = movieSeeds
            .SelectMany(seed => seed.Actors)
            .Select(actor => actor.Name)
            .Distinct(StringComparer.Ordinal)
            .ToArray();
        var existingMovies = context.Movies
            .Where(movie => titles.Contains(movie.Title))
            .ToList();
        var existingActors = context.Actors
            .Where(actor => actorNames.Contains(actor.Name))
            .AsEnumerable()
            .GroupBy(actor => actor.Name, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        foreach (var seed in movieSeeds)
        {
            var movie = existingMovies.FirstOrDefault(existingMovie =>
                existingMovie.Title == seed.Title);

            if (movie is null)
            {
                movie = new Movie
                {
                    Title = seed.Title,
                    Year = seed.Year,
                    Genre = seed.Genre,
                    Duration = seed.Duration
                };

                context.Movies.Add(movie);
            }

            if (movie.Id == 0 || !context.MovieDetails.Any(details => details.MovieId == movie.Id))
            {
                context.MovieDetails.Add(new MovieDetails
                {
                    Movie = movie,
                    Synopsis = seed.Synopsis,
                    Language = "Japanese",
                    Budget = seed.Budget
                });
            }

            foreach (var actorSeed in seed.Actors)
            {
                if (!existingActors.TryGetValue(actorSeed.Name, out var actor))
                {
                    actor = new Actor { Name = actorSeed.Name };
                    context.Actors.Add(actor);
                    existingActors.Add(actor.Name, actor);
                }

                if (movie.Id == 0 || actor.Id == 0 ||
                    !context.MovieActors.Any(movieActor =>
                        movieActor.MovieId == movie.Id && movieActor.ActorId == actor.Id))
                {
                    context.MovieActors.Add(new MovieActor
                    {
                        Movie = movie,
                        Actor = actor,
                        Role = actorSeed.Role
                    });
                }
            }

            if (movie.Id == 0 || !context.Reviews.Any(review =>
                    review.MovieId == movie.Id &&
                    review.ReviewerName == "Archive Curator" &&
                    review.Comment == seed.ReviewComment))
            {
                context.Reviews.Add(new Review
                {
                    Movie = movie,
                    ReviewerName = "Archive Curator",
                    Rating = seed.ReviewRating,
                    Comment = seed.ReviewComment
                });
            }
        }

        context.SaveChanges();
    }

    private static void EnrichSeededCatalog(MovieContext context)
    {
        var seeds = GetCatalogSeeds();
        var titles = seeds.Select(seed => seed.Title).ToArray();
        var moviesByTitle = context.Movies
            .Where(movie => titles.Contains(movie.Title))
            .AsEnumerable()
            .GroupBy(movie => movie.Title, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        foreach (var seed in seeds)
        {
            if (moviesByTitle.ContainsKey(seed.Title)) continue;

            var movie = new Movie
            {
                Title = seed.Title,
                Year = seed.Year,
                Genre = seed.Genre,
                Duration = seed.Duration
            };
            context.Movies.Add(movie);
            moviesByTitle.Add(seed.Title, movie);
        }

        context.SaveChanges();

        moviesByTitle = context.Movies
            .Where(movie => titles.Contains(movie.Title))
            .Include(movie => movie.MovieDetails)
            .Include(movie => movie.Reviews)
            .AsEnumerable()
            .GroupBy(movie => movie.Title, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        var actorSeeds = seeds
            .SelectMany(seed => seed.Cast)
            .GroupBy(actor => actor.Name, StringComparer.Ordinal)
            .Select(group => group.First())
            .ToList();
        var actorNames = actorSeeds.Select(actor => actor.Name).ToArray();
        var actorsByName = context.Actors
            .Where(actor => actorNames.Contains(actor.Name))
            .AsEnumerable()
            .GroupBy(actor => actor.Name, StringComparer.Ordinal)
            .ToDictionary(group => group.Key, group => group.First(), StringComparer.Ordinal);

        foreach (var seed in actorSeeds)
        {
            if (!actorsByName.TryGetValue(seed.Name, out var actor))
            {
                actor = new Actor { Name = seed.Name, BirthYear = seed.BirthYear };
                context.Actors.Add(actor);
                actorsByName.Add(seed.Name, actor);
            }
            else if (actor.BirthYear == 0)
            {
                actor.BirthYear = seed.BirthYear;
            }
        }

        context.SaveChanges();

        var movieActors = context.MovieActors
            .Where(movieActor => titles.Contains(movieActor.Movie.Title))
            .Include(movieActor => movieActor.Movie)
            .Include(movieActor => movieActor.Actor)
            .ToList();
        var linksByMovieAndActor = movieActors.ToDictionary(
            movieActor => (movieActor.Movie.Title, movieActor.Actor.Name),
            movieActor => movieActor);

        foreach (var seed in seeds)
        {
            var movie = moviesByTitle[seed.Title];

            if (movie.MovieDetails is null)
            {
                context.MovieDetails.Add(new MovieDetails
                {
                    Movie = movie,
                    Synopsis = seed.Synopsis,
                    Language = seed.Language,
                    Budget = seed.Budget
                });
            }
            else if (string.IsNullOrWhiteSpace(movie.MovieDetails.Synopsis) ||
                     movie.MovieDetails.Synopsis.Length < 120)
            {
                movie.MovieDetails.Synopsis = seed.Synopsis;
            }

            foreach (var castSeed in seed.Cast)
            {
                var key = (seed.Title, castSeed.Name);
                if (linksByMovieAndActor.TryGetValue(key, out var existingLink))
                {
                    if (string.IsNullOrWhiteSpace(existingLink.Role))
                    {
                        existingLink.Role = castSeed.Role;
                    }
                    continue;
                }

                var link = new MovieActor
                {
                    Movie = movie,
                    Actor = actorsByName[castSeed.Name],
                    Role = castSeed.Role
                };
                context.MovieActors.Add(link);
                linksByMovieAndActor.Add(key, link);
            }

            AddMissingDemoReviews(context, movie);
        }

        context.SaveChanges();
    }

    private static void AddMissingDemoReviews(MovieContext context, Movie movie)
    {
        var reviewSeeds = new[]
        {
            new ReviewSeed(
                "Archive Curator",
                $"{movie.Title} presents its central story with clear character stakes and a distinctive sense of place.",
                4),
            new ReviewSeed(
                "Cinematheque Member",
                $"{movie.Title} rewards attention to its performances, atmosphere and carefully developed themes.",
                4)
        };
        var reviewCount = movie.Reviews.Count;

        foreach (var seed in reviewSeeds)
        {
            if (reviewCount >= 2) break;
            if (movie.Reviews.Any(review =>
                    review.ReviewerName == seed.ReviewerName &&
                    review.Comment == seed.Comment))
            {
                continue;
            }

            var review = new Review
            {
                Movie = movie,
                ReviewerName = seed.ReviewerName,
                Comment = seed.Comment,
                Rating = seed.Rating
            };
            context.Reviews.Add(review);
            reviewCount++;
        }
    }

    private static List<MovieSeed> GetCatalogSeeds() =>
    [
        new("Inception", 2010, "Sci-Fi", 148, "English", 160000000,
            "Dom Cobb extracts secrets by entering other people's dreams, but a chance to return home requires him to plant an idea instead. As the team builds layered dream worlds, Cobb's unresolved memories threaten the carefully planned mission.",
            [new("Leonardo DiCaprio", 1974, "Dom Cobb"), new("Joseph Gordon-Levitt", 1981, "Arthur"), new("Elliot Page", 1987, "Ariadne")]),
        new("The Matrix", 1999, "Sci-Fi", 136, "English", 63000000,
            "Computer programmer Thomas Anderson learns that the world he knows is an artificial simulation controlled by machines. Guided by Morpheus and Trinity, he must decide whether to accept the truth and challenge the system holding humanity captive.",
            [new("Keanu Reeves", 1964, "Neo"), new("Laurence Fishburne", 1961, "Morpheus"), new("Carrie-Anne Moss", 1967, "Trinity")]),
        new("Braveheart", 1995, "History/Drama", 178, "English", 72000000,
            "After personal tragedy under English rule, William Wallace becomes a leader in Scotland's struggle for independence. His campaign brings military victories and political resistance while forcing him to weigh loyalty, sacrifice and freedom.",
            [new("Mel Gibson", 1956, "William Wallace"), new("Sophie Marceau", 1966, "Princess Isabelle"), new("Patrick McGoohan", 1928, "King Edward I")]),
        new("Gladiator", 2000, "Action/Drama", 155, "English", 103000000,
            "Roman general Maximus is betrayed when Commodus seizes power and destroys his former life. Forced into slavery, Maximus rises through the gladiatorial arena while seeking justice and a way to protect Rome's future.",
            [new("Russell Crowe", 1964, "Maximus"), new("Joaquin Phoenix", 1974, "Commodus"), new("Connie Nielsen", 1965, "Lucilla")]),
        new("Troy", 2004, "History/Action", 163, "English", 175000000,
            "The abduction of Helen draws the Greek kingdoms into war against Troy, where pride and duty shape the fate of soldiers and rulers. Achilles, Hector and Paris confront competing loyalties as the long siege tests both armies.",
            [new("Brad Pitt", 1963, "Achilles"), new("Eric Bana", 1968, "Hector"), new("Orlando Bloom", 1977, "Paris")]),
        new("Titanic", 1997, "Romance/Drama", 195, "English", 200000000,
            "Rose, a young passenger constrained by wealth and expectation, meets the free-spirited artist Jack aboard the Titanic. Their relationship crosses class boundaries as the ship continues toward the disaster that will transform every life on board.",
            [new("Leonardo DiCaprio", 1974, "Jack Dawson"), new("Kate Winslet", 1975, "Rose DeWitt Bukater"), new("Billy Zane", 1966, "Cal Hockley")]),
        new("Avatar", 2009, "Sci-Fi/Adventure", 162, "English", 237000000,
            "Paraplegic marine Jake Sully joins a mission on Pandora by operating a genetically engineered avatar. As he learns the Na'vi way of life through Neytiri, his loyalties shift and place him at odds with the human campaign threatening their home.",
            [new("Sam Worthington", 1976, "Jake Sully"), new("Zoe Saldaña", 1978, "Neytiri"), new("Sigourney Weaver", 1949, "Dr. Grace Augustine")]),
        new("Hachi: A Dog's Tale", 2009, "Drama/Family", 93, "English", 16000000,
            "Professor Parker Wilson forms an enduring bond with an abandoned Akita he names Hachi. The dog's daily routine at the railway station becomes a quiet testament to loyalty that touches Parker's family and the surrounding community.",
            [new("Richard Gere", 1949, "Parker Wilson"), new("Joan Allen", 1956, "Cate Wilson"), new("Sarah Roemer", 1984, "Andy Wilson")]),
        new("The Pursuit of Happyness", 2006, "Drama", 117, "English", 55000000,
            "Salesman Chris Gardner takes an unpaid stockbroker internship while caring for his young son and facing homelessness. He tries to preserve stability and hope as limited resources and intense competition test his resolve.",
            [new("Will Smith", 1968, "Chris Gardner"), new("Jaden Smith", 1998, "Christopher Gardner"), new("Thandiwe Newton", 1972, "Linda")]),
        new("Black Beauty", 1994, "Family/Drama", 88, "English", 0,
            "Black Beauty recounts a life shaped by a succession of owners, from a peaceful country home to difficult work in Victorian England. Through kindness and mistreatment, the horse's experiences reveal the lasting consequences of human choices.",
            [new("Alan Cumming", 1965, "Black Beauty"), new("Sean Bean", 1959, "Farmer Grey"), new("David Thewlis", 1963, "Jerry Barker")]),
        new("Shutter Island", 2010, "Thriller/Drama", 138, "English", 80000000,
            "U.S. Marshal Teddy Daniels travels to an isolated psychiatric hospital to investigate a patient's disappearance. A gathering storm, guarded staff and fragments of Teddy's past make it increasingly difficult to separate evidence from manipulation.",
            [new("Leonardo DiCaprio", 1974, "Teddy Daniels"), new("Mark Ruffalo", 1967, "Chuck Aule"), new("Ben Kingsley", 1943, "Dr. Cawley")]),
        new("Spirit: Stallion of the Cimarron", 2002, "Animation/Adventure", 83, "English", 80000000,
            "A wild mustang named Spirit is captured during the westward expansion of the American frontier. Refusing to be broken, he forms a bond with Lakota youth Little Creek and struggles to return to his herd and open homeland.",
            [new("Matt Damon", 1970, "Spirit"), new("James Cromwell", 1940, "The Colonel"), new("Daniel Studi", 1976, "Little Creek")]),
        new("Brother Bear", 2003, "Animation/Family", 85, "English", 46000000,
            "After acting out of anger, young hunter Kenai is transformed into a bear and must see the world from a new perspective. Traveling with bear cub Koda, he begins to understand responsibility, grief and the bonds connecting living things.",
            [new("Joaquin Phoenix", 1974, "Kenai"), new("Jeremy Suarez", 1990, "Koda"), new("Jason Raize", 1975, "Denahi")]),
        new("The Lion King", 1994, "Animation/Adventure", 88, "English", 45000000,
            "Young lion Simba is driven from his homeland after the death of his father, Mufasa. Growing up in exile, he must confront the past and decide whether to reclaim his responsibilities to the Pride Lands.",
            [new("Matthew Broderick", 1962, "Adult Simba"), new("Jeremy Irons", 1948, "Scar"), new("James Earl Jones", 1931, "Mufasa")]),
        new("The Call of the Wild", 2020, "Adventure/Drama", 100, "English", 135000000,
            "Buck is taken from his comfortable California home and pressed into service as a sled dog in the Yukon. Under the care of John Thornton, he discovers resilience, companionship and a growing pull toward the wilderness.",
            [new("Harrison Ford", 1942, "John Thornton"), new("Omar Sy", 1978, "Perrault"), new("Cara Gee", 1983, "Françoise")]),
        new("Free Willy", 1993, "Family/Adventure", 112, "English", 20000000,
            "Troubled foster child Jesse is assigned to clean an aquarium where he befriends an isolated orca named Willy. When he learns that Willy is in danger, Jesse works with the people he trusts to return the whale to the ocean.",
            [new("Jason James Richter", 1980, "Jesse"), new("Lori Petty", 1963, "Rae Lindley"), new("Jayne Atkinson", 1959, "Annie Greenwood")]),
        new("The Last Samurai", 2003, "Action/Drama", 154, "English", 140000000,
            "Disillusioned American officer Nathan Algren is hired to train Japan's modernizing army against a samurai rebellion. Captivity among Katsumoto's community challenges his assumptions about honor, discipline and the cost of rapid change.",
            [new("Tom Cruise", 1962, "Nathan Algren"), new("Ken Watanabe", 1959, "Katsumoto"), new("Hiroyuki Sanada", 1960, "Ujio")]),
        new("The Lord of the Rings: The Fellowship of the Ring", 2001, "Fantasy/Adventure", 178, "English", 93000000,
            "Frodo Baggins inherits a ring whose power threatens all of Middle-earth and leaves the Shire to keep it from the enemy. A fellowship forms around him, but the journey tests their courage and exposes the ring's power to divide them.",
            [new("Elijah Wood", 1981, "Frodo Baggins"), new("Ian McKellen", 1939, "Gandalf"), new("Viggo Mortensen", 1958, "Aragorn")]),
        new("The Lord of the Rings: The Two Towers", 2002, "Fantasy/Adventure", 179, "English", 94000000,
            "The broken fellowship follows separate paths while Saruman's forces advance across Middle-earth. Frodo and Sam continue toward Mordor with the conflicted Gollum, while Aragorn and his allies prepare Rohan for war.",
            [new("Elijah Wood", 1981, "Frodo Baggins"), new("Ian McKellen", 1939, "Gandalf"), new("Viggo Mortensen", 1958, "Aragorn")]),
        new("The Lord of the Rings: The Return of the King", 2003, "Fantasy/Adventure", 201, "English", 94000000,
            "As Sauron's armies move against Gondor, Aragorn must accept his inheritance and unite those prepared to resist. Frodo and Sam approach Mount Doom under increasing strain while their allies fight to give them time.",
            [new("Elijah Wood", 1981, "Frodo Baggins"), new("Ian McKellen", 1939, "Gandalf"), new("Viggo Mortensen", 1958, "Aragorn")]),
        new("The Hobbit: An Unexpected Journey", 2012, "Fantasy/Adventure", 169, "English", 180000000,
            "Bilbo Baggins leaves his quiet home with Gandalf and a company of dwarves seeking to reclaim Erebor. The reluctant traveler encounters danger, unexpected courage and a mysterious ring that will shape a much larger story.",
            [new("Martin Freeman", 1971, "Bilbo Baggins"), new("Ian McKellen", 1939, "Gandalf"), new("Richard Armitage", 1971, "Thorin Oakenshield")]),
        new("The Hobbit: The Desolation of Smaug", 2013, "Fantasy/Adventure", 161, "English", 217000000,
            "Bilbo and the dwarves continue through hostile lands toward the Lonely Mountain while danger gathers behind them. Inside Erebor, Bilbo must face the dragon Smaug and help Thorin's company recover what was lost.",
            [new("Martin Freeman", 1971, "Bilbo Baggins"), new("Ian McKellen", 1939, "Gandalf"), new("Richard Armitage", 1971, "Thorin Oakenshield")]),
        new("The Hobbit: The Battle of the Five Armies", 2014, "Fantasy/Adventure", 144, "English", 250000000,
            "The recovery of Erebor creates new conflict as dwarves, elves and humans make competing claims around the mountain. With a larger enemy approaching, Bilbo tries to preserve friendship and reason amid the gathering armies.",
            [new("Martin Freeman", 1971, "Bilbo Baggins"), new("Ian McKellen", 1939, "Gandalf"), new("Richard Armitage", 1971, "Thorin Oakenshield")]),
        new("My Neighbor Totoro", 1988, "Anime", 86, "Japanese", 0,
            "Sisters Satsuki and Mei move to the countryside with their father while their mother recovers in hospital. In the nearby forest they encounter gentle spirits, including the enormous Totoro, who bring wonder and reassurance during an uncertain summer.",
            [new("Noriko Hidaka", 1962, "Satsuki Kusakabe"), new("Chika Sakamoto", 1959, "Mei Kusakabe"), new("Hitoshi Takagi", 1925, "Totoro")]),
        new("Princess Mononoke", 1997, "Anime", 133, "Japanese", 0,
            "Prince Ashitaka travels west seeking a cure for a supernatural wound and finds a conflict between Iron Town and the forest gods. He tries to understand both Lady Eboshi and San without ignoring the destruction surrounding them.",
            [new("Yōji Matsuda", 1967, "Ashitaka"), new("Yuriko Ishida", 1969, "San"), new("Yūko Tanaka", 1955, "Lady Eboshi")]),
        new("Howl's Moving Castle", 2004, "Anime", 119, "Japanese", 0,
            "Young hat maker Sophie is cursed with an elderly body and seeks refuge in wizard Howl's wandering castle. As war closes in, she becomes part of the castle's unusual household and discovers the fears behind Howl's magic.",
            [new("Chieko Baishō", 1941, "Sophie"), new("Takuya Kimura", 1972, "Howl"), new("Akihiro Miwa", 1935, "Witch of the Waste")]),
        new("Spirited Away", 2001, "Anime", 125, "Japanese", 0,
            "Ten-year-old Chihiro enters a spirit realm where her parents are transformed and she must work in Yubaba's bathhouse. With help from Haku, she learns courage and resourcefulness while searching for a way to free her family.",
            [new("Rumi Hiiragi", 1987, "Chihiro Ogino"), new("Miyu Irino", 1988, "Haku"), new("Mari Natsuki", 1952, "Yubaba / Zeniba")]),
        new("The Cat Returns", 2002, "Anime/Adventure/Fantasy", 75, "Japanese", 20000000,
            "After saving a mysterious cat from traffic, shy student Haru is swept into the Cat Kingdom and promised to its prince. With help from the Baron, Muta and Toto, she must recover her confidence and escape before she becomes a cat herself.",
            [new("Chizuru Ikewaki", 1981, "Haru Yoshioka"), new("Yoshihiko Hakamada", 1973, "Baron Humbert von Gikkingen"), new("Tetsu Watanabe", 1950, "Muta"), new("Yōsuke Saitō", 1951, "Toto"), new("Tetsurō Tamba", 1922, "The Cat King"), new("Aki Maeda", 1985, "Yuki"), new("Takayuki Yamada", 1983, "Prince Lune")]),
        new("Wolf Children", 2012, "Anime/Drama/Fantasy", 117, "Japanese", 0,
            "Hana builds a family with a man who can transform into a wolf and becomes mother to Yuki and Ame. Raising the children alone in the countryside, she supports them as each begins to choose between human society and the wild.",
            [new("Aoi Miyazaki", 1985, "Hana"), new("Takao Osawa", 1968, "Wolf Man"), new("Haru Kuroki", 1990, "Yuki"), new("Momoka Ono", 2001, "Young Yuki"), new("Yukito Nishii", 1995, "Ame"), new("Amon Kabe", 2003, "Young Ame"), new("Takuma Hiraoka", 1998, "Sōhei Fujii")]),
        new("Demon Slayer -Kimetsu no Yaiba- The Movie: Mugen Train", 2020, "Anime/Action/Fantasy", 117, "Japanese", 0,
            "Tanjiro, Nezuko, Zenitsu and Inosuke board the Mugen Train to assist Flame Hashira Kyojuro Rengoku with a series of disappearances. Their investigation becomes a battle for the passengers when a demon traps its victims inside carefully constructed dreams.",
            [new("Natsuki Hanae", 1991, "Tanjiro Kamado"), new("Akari Kitō", 1994, "Nezuko Kamado"), new("Hiro Shimono", 1980, "Zenitsu Agatsuma"), new("Yoshitsugu Matsuoka", 1986, "Inosuke Hashibira"), new("Satoshi Hino", 1978, "Kyojuro Rengoku"), new("Daisuke Hirakawa", 1973, "Enmu"), new("Akira Ishida", 1967, "Akaza")])
    ];

    private sealed record MovieSeed(
        string Title,
        int Year,
        string Genre,
        int Duration,
        string Language,
        decimal Budget,
        string Synopsis,
        List<CastSeed> Cast);

    private sealed record CastSeed(string Name, int BirthYear, string Role);
    private sealed record ReviewSeed(string ReviewerName, string Comment, int Rating);
}
