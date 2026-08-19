# MovieAPI

MovieAPI är ett ASP.NET Core Web API byggt som en skoluppgift för att träna på API-utveckling, Entity Framework Core, relationer i databasen och en tydlig lagerindelad struktur. Projektet hanterar filmer, skådespelare, recensioner och detaljerad information om varje film.

Målet med projektet är att visa ett fungerande Web API med databas, CRUD, DTOs, repository pattern, service layer, seed data, Swagger och tester.

## Tech Stack

* C#
* ASP.NET Core Web API
* Entity Framework Core
* SQLite
* Swagger / OpenAPI
* xUnit
* Moq

## Architecture / Project Structure

Projektet är uppdelat i flera lager för att separera ansvar och göra koden enklare att förstå, testa och vidareutveckla.

```text
MovieApi/
├── Controllers/        # API-endpoints
├── Data/               # DbContext
├── DTOs/               # Data Transfer Objects och valideringsmodeller
├── Extensions/         # SeedData
├── Middleware/         # Global exception handling
├── Migrations/         # EF Core migrations
├── Models/             # Databasmodeller/entities
├── Repositories/       # Databaslogik
├── Services/           # Affärslogik
└── Program.cs          # Dependency Injection, middleware och app-konfiguration
```

Flödet i applikationen är:

```text
Controller → Service → Repository → DbContext → SQLite
```

## Features

* Hämta alla filmer
* Hämta en specifik film via id
* Hämta en film med detaljer, recensioner och skådespelare
* Skapa ny film
* Uppdatera film
* Ta bort film
* Filtrera filmer på genre och år
* Söka filmer på titel
* Sortera filmer på titel, år eller längd
* Paginering med page och pageSize
* Seed data med filmer, skådespelare, recensioner och filmdetaljer
* DTOs för att inte exponera databasen direkt i API:t
* Validering med DataAnnotations
* Global error handling via middleware
* JWT-autentisering för administrativa endpoints
* Swagger för att testa API:t
* Enhetstester för controller och service

## Database Relationships

Projektet innehåller flera typer av relationer:

* **Movie → MovieDetails**: one-to-one
* **Movie → Reviews**: one-to-many
* **Movie ↔ Actor**: many-to-many via `MovieActor`

## API Endpoints

| Method | Endpoint                   | Description                                                     |
| ------ | -------------------------- | --------------------------------------------------------------- |
| GET    | `/api/movies`              | Hämtar filmer med filtrering, sökning, sortering och paginering |
| GET    | `/api/movies/{id}`         | Hämtar en specifik film                                         |
| GET    | `/api/movies/{id}/details` | Hämtar film med detaljer, recensioner och skådespelare          |
| POST   | `/api/movies`              | Skapar en ny film                                               |
| PUT    | `/api/movies/{id}`         | Uppdaterar en film                                              |
| DELETE | `/api/movies/{id}`         | Tar bort en film                                                |

Exempel på query:

```http
GET /api/movies?genre=Sci-Fi&sortBy=year&descending=true&page=1&pageSize=10
```

Exempel på POST body:

```json
{
  "title": "Interstellar",
  "genre": "Sci-Fi",
  "releaseYear": 2014,
  "duration": 169
}
```

## Setup

1. Klona repot eller öppna projektet lokalt.

2. Kör restore:

```bash
dotnet restore
```

3. Skapa/uppdatera databasen:

```bash
dotnet ef database update --project MovieApi
```

4. Sätt JWT-hemligheter lokalt. Värdena nedan är platshållare och ska ersättas
   med egna lokala värden:

```bash
dotnet user-secrets set "Jwt:Key" "<minst-32-tecken-lokal-signeringsnyckel>" --project MovieApi
dotnet user-secrets set "Jwt:AdminPassword" "<starkt-lokalt-adminlosenord>" --project MovieApi
```

Alternativt kan miljövariabler användas. I PowerShell:

```powershell
$env:Jwt__Key="<minst-32-tecken-lokal-signeringsnyckel>"
$env:Jwt__AdminPassword="<starkt-lokalt-adminlosenord>"
```

`Jwt:Issuer`, `Jwt:Audience`, `Jwt:AdminUsername` och tokenlivslängden ligger som
icke-hemliga standardvärden i `appsettings.json`. API:t vägrar starta och visar
vilka inställningar som saknas om JWT-konfigurationen är ogiltig.

5. Starta API:t:

```bash
dotnet run --project MovieApi
```

6. Öppna Swagger i webbläsaren:

```text
https://localhost:<port>/swagger
```

## Run Tests

```bash
dotnet test
```
