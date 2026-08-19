namespace MovieApi.DTOs;

public sealed record RankedMovieDto(
    int Rank,
    int MovieId,
    string Title,
    double? AverageRating,
    int ReviewCount);

public sealed record TopMoviesByGenreDto(
    string Genre,
    List<RankedMovieDto> Movies);

public sealed record MovieAverageRatingDto(
    int MovieId,
    string Title,
    double? AverageRating,
    int ReviewCount);

public sealed record ActiveActorDto(
    int Rank,
    int ActorId,
    string Name,
    int MovieCount);
