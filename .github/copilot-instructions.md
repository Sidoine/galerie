# Galerie Photos - GitHub Copilot Instructions

## Project Overview

Galerie Photos is a video/photo gallery application that serves media files from the local file system, where the directory structure represents albums. It consists of:

- **Backend**: C#/.NET 9 ASP.NET Core web API
- **Frontend**: TypeScript React application built with Vite
- **Database**: PostgreSQL for metadata storage
- **File Storage**: Local file system for media files and thumbnails

## Architecture

### Backend (C#/.NET 9)

- **Framework**: ASP.NET Core 9.0 with Entity Framework Core
- **Database**: PostgreSQL via Npgsql provider
- **Authentication**: ASP.NET Core Identity
- **Image Processing**: SixLabors.ImageSharp for image manipulation
- **Video Processing**: Xabe.FFmpeg for video thumbnails and processing
- **API**: RESTful controllers for Directory, Photo, and User management

### Frontend (TypeScript React)

- **Build Tool**: Expo with TypeScript support
- **UI Framework**: React Native
- **State Management**: MobX 6.x
- **Routing**: React Navigation
- **Maps**: Leaflet with react-leaflet for photo geolocation
- **Package Manager**: Yarn 4.5.3 with Corepack

### Key Models

- **Photo**: Represents image/video files with metadata (filename, GPS coordinates, camera info, datetime)
- **PhotoDirectory**: Represents album directories with visibility settings
- **ApplicationUser**: Extended Identity user with additional properties

### File System Organization

- Media files are organized in directories that represent albums
- Thumbnails are generated and stored alongside original files
- Directory structure is scanned and synchronized with database metadata

## Development Setup

### Prerequisites

- .NET 9 SDK
- Node.js 20.x
- Yarn 4.5.3 (via Corepack)
- PostgreSQL database
- FFmpeg (for video processing)

### Backend Development

```bash
# Navigate to backend directory
cd GaleriePhotos

# Restore dependencies
dotnet restore

# Build the project
dotnet build

# Run database migrations
dotnet ef database update

# Run the application (development)
dotnet run

# Run the tests
dotnet test
```

### Frontend Development

```bash
# Navigate to frontend directory
cd GaleriePhotos/ClientApp

# Install dependencies
yarn install

# Start development server
yarn start

# Build for production
yarn build

# Run linting
yarn lint
```

### Docker Development

```bash
# Build Docker image
docker build -t galerie .

# Run with database connection
docker run --rm -p 5000:5000 --env DATABASE_URL=postgres://user:pass@host:port/db galerie
```

## Code Patterns and Conventions

### Backend Patterns

- **Controllers**: Located in `Controllers/` directory, inherit from `Controller` base class
- **Models**: Data models in `Models/` directory using Entity Framework conventions
- **Services**: Business logic in `Services/` directory, registered via dependency injection
- **ViewModels**: API request/response models in `ViewModels/` directory
- **Configuration**: Settings in `appsettings.json` with environment-specific overrides
- Tests are located in the GaleriePhotos.Tests project and should mirror the structure of the main project

### Frontend Patterns

- **Services**: API client services auto-generated from C# controllers using Folke.CsTsService
- **Stores**: MobX stores for state management in `stores/`
- **Components**: React (React Native / Expo) components in `components/`
- **Routing**: React Navigation (Expo Router / file-based where applicable). Screens are in `app/`.
- **Styling**: React Native core components + StyleSheet / inline styles (aucune dépendance Material-UI). Éviter d'introduire Material-UI : rester cohérent avec l'écosystème Expo/React Native.
- **Hooks Performance**: Stabiliser les callbacks et valeurs dérivées avec `useCallback` / `useMemo` lorsque passés à des composants enfants susceptibles de mémoriser (`React.memo`) ou déclencher des effets. Ne pas sur-utiliser : si la fonction n'est pas passée en prop et est triviale, `useCallback` est optionnel.

### Database Patterns

- **Migrations**: Entity Framework migrations in `Migrations/` directory
- **Relationships**: Photos belong to PhotoDirectories, users have access controls
- **Indexing**: Optimized queries for file system path lookups

## Common Development Tasks

### Adding New API Endpoints

1. Add method to appropriate controller (e.g., `PhotoController.cs`)
2. Create/update view models in `ViewModels/` if needed
3. Generate updated TypeScript services (see "Generating TypeScript Services" below)
4. Update frontend components to use new endpoints

### Generating TypeScript Services

When controllers are modified, the TypeScript services need to be regenerated to reflect API changes:

```bash
# Generate TypeScript services without starting the web server
dotnet run --project GaleriePhotos -- --generate-services
```

This command:

- Builds the application and creates a temporary host
- Uses Folke.CsTsService to scan controllers and generate TypeScript client code
- Updates files in `GaleriePhotos/ClientApp/src/services/`
- Exits without starting the web server

The TypeScript services are auto-generated from C# controllers and should not be modified manually. The generated files include:

- `directory.ts` - Directory/album management API calls
- `photo.ts` - Photo management and metadata API calls
- `user.ts` - User management and authentication API calls
- `views.ts` - TypeScript interfaces matching C# ViewModels
- `enums.ts` - TypeScript enums from C# enums

### Database Schema Changes

1. Modify models in `Models/` directory
2. Create migration: `dotnet ef migrations add MigrationName`
3. Apply migration: `dotnet ef database update`
4. Update any affected controllers or services

### Adding Frontend Features

1. Créer / mettre à jour des composants React Native (Expo) dans `src/components/`
2. Ajouter la gestion d'état dans les stores MobX si nécessaire
3. Mettre à jour la configuration de routage (Expo Router / React Navigation) si de nouvelles pages sont ajoutées
4. Styling: utiliser les primitives React Native (View, Text, Image, etc.) et `StyleSheet` / styles utilitaires existants. Ne pas ajouter Material-UI.
5. Lorsque vous définissez des fonctions passées comme props à des composants enfants ou utilisées dans des dépendances de `useEffect`, les encapsuler dans `useCallback` avec une liste de dépendances minimale et correcte pour éviter des re-rendus inutiles.

### Image/Video Processing

- Use `PhotoService` for image operations (thumbnails, rotation, EXIF data)
- FFmpeg integration handles video thumbnail generation
- Images are processed with ImageSharp for resizing and format conversion

## Configuration

### Backend Configuration

- `appsettings.json`: Base configuration
- `appsettings.Development.json`: Development overrides
- `appsettings.Production.json`: Production overrides
- User secrets for sensitive data during development

### Frontend Configuration

- `vite.config.ts`: Build configuration
- `tsconfig.json`: TypeScript configuration
- `package.json`: Dependencies and scripts

### Database Configuration

- Connection strings in appsettings files
- Entity Framework context in `Data/ApplicationDbContext.cs`
- Database provider: PostgreSQL

## Testing and Quality

### Current Status

- Frontend has ESLint configuration (currently needs migration to v9 format)
- No comprehensive test suite currently implemented
- Linting available via `yarn lint` (frontend)

### Build Process

- Backend: `dotnet build` compiles C# code
- Frontend: `yarn build` creates production bundle via Vite
- Docker: Multi-stage build combines both backend and frontend

## File Structure

```
/
├── .github/
│   ├── copilot-instructions.md (this file)
│   └── copilot-setup-steps.yml (environment setup)
├── GaleriePhotos/ (backend)
│   ├── Controllers/ (API controllers)
│   ├── Models/ (data models)
│   ├── Services/ (business logic)
│   ├── Data/ (Entity Framework context)
│   ├── ClientApp/ (frontend React app)
│   │   ├── apps/ (applications screens using expo router)
│   │   ├── components/
│   │   ├── services/ (auto-generated API clients)
│   │   ├── stores/ (MobX state management)
│   │   └── package.json
│   └── GaleriePhotos.csproj
├── GaleriePhotos.sln
├── Dockerfile
└── README.md
```

## Important Notes

- The application reads media files directly from the file system
- Directory structure represents the album hierarchy
- Database stores metadata and user permissions, not the files themselves
- Thumbnails are generated on-demand and cached on disk
- The frontend services are auto-generated from C# controllers - do not edit them manually
- PostgreSQL is required for the application to function
- FFmpeg must be available for video processing features
