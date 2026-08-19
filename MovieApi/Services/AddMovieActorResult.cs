using MovieApi.DTOs;

namespace MovieApi.Services;

public enum AddMovieActorStatus
{
    Created,
    InvalidRequest,
    MovieNotFound,
    ActorNotFound,
    Duplicate
}

public record AddMovieActorResult(
    AddMovieActorStatus Status,
    ActorDto? Actor = null);
