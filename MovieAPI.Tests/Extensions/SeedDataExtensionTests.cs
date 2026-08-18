using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using MovieApi.Data;
using MovieApi.Extensions;
using MovieApi.Models;

namespace MovieAPI.Tests.Extensions;

public class SeedDataExtensionTests
{
    [Fact]
    public void SeedData_CompletesCatalog_AndIsIdempotent()
    {
        using var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();
        using var context = CreateContext(connection);
        context.Database.EnsureCreated();

        SeedDataExtension.SeedData(context);

        var movies = LoadMovies(context);
        Assert.Equal(30, movies.Count);
        Assert.All(movies, movie =>
        {
            Assert.NotNull(movie.MovieDetails);
            Assert.True(movie.MovieDetails.Synopsis.Length >= 120);
            var expectedActorCount = AnimeTitlesWithSevenActors.Contains(movie.Title)
                ? 7
                : 3;
            Assert.Equal(expectedActorCount, movie.MovieActors.Count);
            Assert.Equal(2, movie.Reviews.Count);
        });
        Assert.DoesNotContain(context.Actors, actor => actor.BirthYear == 0);

        AssertAnimeCast(movies, "The Cat Returns", CatReturnsCast);
        AssertAnimeCast(movies, "Wolf Children", WolfChildrenCast);
        AssertAnimeCast(movies,
            "Demon Slayer -Kimetsu no Yaiba- The Movie: Mugen Train",
            MugenTrainCast);

        var countsAfterFirstRun = GetCounts(context);

        SeedDataExtension.SeedData(context);

        Assert.Equal(countsAfterFirstRun, GetCounts(context));
        Assert.Equal(
            context.Actors.Count(),
            context.Actors.Select(actor => actor.Name).Distinct().Count());
        Assert.Equal(
            context.Movies.Count(),
            context.Movies.Select(movie => movie.Title).Distinct().Count());
    }

    [Fact]
    public void SeedData_DoesNotOverwriteExistingNonZeroBirthYear()
    {
        using var connection = new SqliteConnection("Data Source=:memory:");
        connection.Open();
        using var context = CreateContext(connection);
        context.Database.EnsureCreated();
        context.Actors.AddRange(
            new Actor { Name = "Chizuru Ikewaki", BirthYear = 1900 },
            new Actor { Name = "Leonardo DiCaprio", BirthYear = 1901 });
        context.SaveChanges();

        SeedDataExtension.SeedData(context);

        var actor = Assert.Single(context.Actors,
            actor => actor.Name == "Chizuru Ikewaki");
        Assert.Equal(1900, actor.BirthYear);
        var baseActor = Assert.Single(context.Actors,
            actor => actor.Name == "Leonardo DiCaprio");
        Assert.Equal(1901, baseActor.BirthYear);
    }

    private static MovieContext CreateContext(SqliteConnection connection)
    {
        var options = new DbContextOptionsBuilder<MovieContext>()
            .UseSqlite(connection)
            .Options;
        return new MovieContext(options);
    }

    private static List<Movie> LoadMovies(MovieContext context) => context.Movies
        .Include(movie => movie.MovieDetails)
        .Include(movie => movie.Reviews)
        .Include(movie => movie.MovieActors)
        .ThenInclude(movieActor => movieActor.Actor)
        .OrderBy(movie => movie.Title)
        .ToList();

    private static (int Movies, int Details, int Actors, int Links, int Reviews)
        GetCounts(MovieContext context) =>
        (
            context.Movies.Count(),
            context.MovieDetails.Count(),
            context.Actors.Count(),
            context.MovieActors.Count(),
            context.Reviews.Count()
        );

    private static void AssertAnimeCast(
        List<Movie> movies,
        string title,
        IReadOnlyDictionary<string, (int BirthYear, string Role)> expectedCast)
    {
        var movie = Assert.Single(movies, movie => movie.Title == title);
        Assert.Equal(7, movie.MovieActors.Count);

        foreach (var (name, expected) in expectedCast)
        {
            var movieActor = Assert.Single(movie.MovieActors,
                movieActor => movieActor.Actor.Name == name);
            Assert.Equal(expected.BirthYear, movieActor.Actor.BirthYear);
            Assert.Equal(expected.Role, movieActor.Role);
        }
    }

    private static readonly IReadOnlyDictionary<string, (int, string)> CatReturnsCast =
        new Dictionary<string, (int, string)>
        {
            ["Chizuru Ikewaki"] = (1981, "Haru Yoshioka"),
            ["Yoshihiko Hakamada"] = (1973, "Baron Humbert von Gikkingen"),
            ["Tetsu Watanabe"] = (1950, "Muta"),
            ["Yōsuke Saitō"] = (1951, "Toto"),
            ["Tetsurō Tamba"] = (1922, "The Cat King"),
            ["Aki Maeda"] = (1985, "Yuki"),
            ["Takayuki Yamada"] = (1983, "Prince Lune")
        };

    private static readonly IReadOnlyDictionary<string, (int, string)> WolfChildrenCast =
        new Dictionary<string, (int, string)>
        {
            ["Aoi Miyazaki"] = (1985, "Hana"),
            ["Takao Osawa"] = (1968, "Wolf Man"),
            ["Haru Kuroki"] = (1990, "Yuki"),
            ["Momoka Ono"] = (2001, "Young Yuki"),
            ["Yukito Nishii"] = (1995, "Ame"),
            ["Amon Kabe"] = (2003, "Young Ame"),
            ["Takuma Hiraoka"] = (1998, "Sōhei Fujii")
        };

    private static readonly IReadOnlyDictionary<string, (int, string)> MugenTrainCast =
        new Dictionary<string, (int, string)>
        {
            ["Natsuki Hanae"] = (1991, "Tanjiro Kamado"),
            ["Akari Kitō"] = (1994, "Nezuko Kamado"),
            ["Hiro Shimono"] = (1980, "Zenitsu Agatsuma"),
            ["Yoshitsugu Matsuoka"] = (1986, "Inosuke Hashibira"),
            ["Satoshi Hino"] = (1978, "Kyojuro Rengoku"),
            ["Daisuke Hirakawa"] = (1973, "Enmu"),
            ["Akira Ishida"] = (1967, "Akaza")
        };

    private static readonly HashSet<string> AnimeTitlesWithSevenActors =
    [
        "The Cat Returns",
        "Wolf Children",
        "Demon Slayer -Kimetsu no Yaiba- The Movie: Mugen Train"
    ];
}
