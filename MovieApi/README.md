# MovieApiStarter

ASP.NET Core Web API för Movie API med EF Core, SQLite, Controllers, Services, Repositories, DTOs och SeedData.

## Kör
```bash
dotnet restore
dotnet tool install --global dotnet-ef
dotnet ef migrations add InitialCreate
dotnet ef database update
dotnet run
```

Öppna Swagger: `https://localhost:<port>/swagger`

## Testa snabbt
- GET `/api/movies`
- GET `/api/movies/1/details`
- POST `/api/movies`
```json
{
  "title": "Interstellar",
  "year": 2014,
  "genre": "Sci-Fi",
  "duration": 169
}
```
