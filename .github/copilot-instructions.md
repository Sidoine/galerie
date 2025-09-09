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

- **Build Tool**: Vite 6.x with TypeScript support
- **UI Framework**: Material-UI (MUI) 7.x
- **State Management**: MobX 6.x
- **Routing**: React Router 7.x
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

# Run linting (note: currently has ESLint 9 config issues)
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
- **Stores**: MobX stores for state management in `src/stores/`
- **Components**: React components in `src/components/`
- **Routing**: React Router configuration in main application files
- **Styling**: Material-UI theming and component styling

### Database Patterns

- **Migrations**: Entity Framework migrations in `Migrations/` directory
- **Relationships**: Photos belong to PhotoDirectories, users have access controls
- **Indexing**: Optimized queries for file system path lookups

## Common Development Tasks

### Adding New API Endpoints

1. Add method to appropriate controller (e.g., `PhotoController.cs`)
2. Create/update view models in `ViewModels/` if needed
3. Frontend services will auto-generate TypeScript types via Folke.CsTsService
4. Update frontend components to use new endpoints

### Database Schema Changes

1. Modify models in `Models/` directory
2. Create migration: `dotnet ef migrations add MigrationName`
3. Apply migration: `dotnet ef database update`
4. Update any affected controllers or services

### Adding Frontend Features

1. Create/update React components in `src/components/`
2. Add state management in MobX stores if needed
3. Update routing configuration if adding new pages
4. Use Material-UI components for consistent styling

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
│   │   ├── src/
│   │   │   ├── components/
│   │   │   ├── services/ (auto-generated API clients)
│   │   │   └── stores/ (MobX state management)
│   │   ├── package.json
│   │   └── vite.config.ts
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
