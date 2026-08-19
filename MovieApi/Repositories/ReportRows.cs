namespace MovieApi.Repositories;

public sealed record MovieRatingReportRow(
    int MovieId,
    string Title,
    string Genre,
    double? AverageRating,
    int ReviewCount);

public sealed record ActorActivityReportRow(
    int ActorId,
    string Name,
    int MovieCount);
