# Galerie Photos

A modern, feature-rich photo and video gallery web application with advanced AI-powered face detection, multi-user support, and mobile-responsive interface.

## Purpose

Galerie Photos is designed to help individuals and organizations organize, manage, and share their photo and video collections. The application automatically scans file system directories to create organized galleries, extracts metadata from media files, and provides features like face detection and recognition to help with finding and organizing photos.

## Key Features

### 📸 Media Management
- **Photo & Video Gallery**: Automatically organizes photos and videos from file system directories
- **Thumbnail Generation**: Automatic thumbnail creation for fast browsing
- **EXIF Data Extraction**: Reads camera information, date/time, GPS coordinates from image metadata
- **Image Processing**: Built-in photo rotation, resizing, and format conversion
- **Video Support**: Video thumbnail generation and playback using FFmpeg

### 🤖 AI-Powered Features
- **Face Detection**: Automatic face detection in photos using AI models
- **Face Recognition**: Identify and group photos by detected faces
- **Face Naming**: Assign names to detected faces for easy photo searching
- **Smart Organization**: Browse photos by recognized people

### 👥 Multi-User Support
- **User Authentication**: Secure login system with ASP.NET Core Identity
- **Gallery Sharing**: Control photo visibility and sharing permissions
- **Member Management**: Invite users to specific galleries with role-based access
- **Privacy Controls**: Mark photos as private or public

### 🌐 Modern Interface
- **Mobile-Responsive**: Built with React Native and Expo for cross-platform support
- **Progressive Web App**: Works seamlessly on desktop and mobile devices
- **Touch-Friendly**: Intuitive touch gestures for mobile browsing
- **Real-time Updates**: Live updates using modern web technologies

### 🗄️ Flexible Storage
- **File System Provider**: Direct access to local file system directories
- **Seafile Integration**: Support for Seafile cloud storage as data provider
- **Multiple Galleries**: Manage multiple separate photo collections
- **Configurable Paths**: Customize root directories and thumbnail storage locations

### 🗺️ Location Features
- **GPS Mapping**: Display photo locations on interactive maps
- **Location-based Browsing**: Find photos by geographic location
- **EXIF GPS Extraction**: Automatic location detection from photo metadata
- **Place Detection**: Automatic place/city detection using OpenStreetMap Nominatim API
- **Place Grouping**: Organize photos by country and city
- **Duplicate Management**: Built-in tool to merge duplicate places (via API endpoint)

### 🔧 Technical Features
- **REST API**: Comprehensive RESTful API for all operations
- **Real-time Processing**: Background services for face detection and media processing
- **Database Storage**: PostgreSQL for metadata and user management
- **Vector Search**: Advanced face similarity search using pgvector
- **Caching**: Optimized thumbnail and metadata caching

## Architecture

- **Backend**: .NET 9 ASP.NET Core Web API
- **Frontend**: React Native with Expo framework
- **Database**: PostgreSQL with Entity Framework Core
- **AI/ML**: FaceAiSharp for face detection and recognition
- **Image Processing**: SixLabors.ImageSharp for image manipulation
- **Video Processing**: Xabe.FFmpeg for video thumbnails and processing
- **State Management**: MobX for reactive state management
- **Authentication**: ASP.NET Core Identity with JWT tokens

## Installation

### Prerequisites

Before installing Galerie Photos, ensure you have the following installed:

- **.NET 9 SDK** - [Download from Microsoft](https://dotnet.microsoft.com/download/dotnet/9.0)
- **Node.js 20.x or later** - [Download from nodejs.org](https://nodejs.org/)
- **Yarn 4.5.3** - Installed via Corepack (comes with Node.js)
- **PostgreSQL** - [Download from postgresql.org](https://www.postgresql.org/downloads/)
- **FFmpeg** - [Download from ffmpeg.org](https://ffmpeg.org/download.html) (for video processing)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Sidoine/galerie.git
   cd galerie
   ```

2. **Setup the database**
   ```bash
   # Create a PostgreSQL database named 'galerie'
   createdb galerie
   ```

3. **Configure the application**
   ```bash
   cd GaleriePhotos
   # Copy and edit the configuration file
   cp appsettings.json appsettings.Development.json
   ```
   
   Edit `appsettings.Development.json` and update the connection string:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Database=galerie;Username=your_user;Password=your_password"
     }
   }
   ```

4. **Install backend dependencies**
   ```bash
   dotnet restore
   ```

5. **Setup the database schema**
   ```bash
   dotnet ef database update
   ```

6. **Install frontend dependencies**
   ```bash
   cd ClientApp
   corepack enable
   yarn install
   ```

7. **Run the application**
   ```bash
   # From the GaleriePhotos directory
   dotnet run
   ```
   
   The application will be available at `https://localhost:5001` or `http://localhost:5000`

### Docker Deployment

For production deployment using Docker:

1. **Build the Docker image**
   ```bash
   docker build -t galerie .
   ```

2. **Run with Docker**
   ```bash
   docker run --rm -p 5000:5000 \
     --env DATABASE_URL=postgres://username:password@host:port/database \
     galerie
   ```

### Configuration Options

The application can be configured through `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Your PostgreSQL connection string"
  },
  "Galerie": {
    "Galleries": [
      {
        "Name": "My Photos",
        "RootDirectory": "/path/to/photos",
        "ThumbnailsDirectory": "/path/to/thumbnails",
        "DataProvider": "FileSystem"
      }
    ]
  },
  "SendGrid": {
    "ApiKey": "your-sendgrid-api-key"
  }
}
```

### Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `ASPNETCORE_ENVIRONMENT`: Set to `Development` or `Production`
- `ASPNETCORE_URLS`: Specify listening URLs (default: `http://+:5000`)

## Usage

1. **Access the application** through your web browser
2. **Register or login** with your user account
3. **Create galleries** by configuring directory paths in settings
4. **Upload or sync photos** - the application will automatically scan configured directories
5. **Browse photos** with the responsive interface
6. **Use face detection** to automatically identify people in photos
7. **Share galleries** with other users by managing member permissions
8. **Enjoy advanced features** like GPS mapping, photo rotation, and smart organization

## API Documentation

The application provides a comprehensive REST API. Key endpoints include:

- `GET /api/galleries` - List available galleries
- `GET /api/photos/{id}` - Get photo details and metadata
- `GET /api/photos/{id}/image` - Download full-size image
- `GET /api/photos/{id}/thumbnail` - Get photo thumbnail
- `GET /api/gallery/{id}/face-names` - List detected faces in gallery
- `POST /api/galleries/{id}/members` - Manage gallery access
- `GET /api/places/gallery/{galleryId}/countries` - List countries with photos in a gallery
- `GET /api/places/gallery/{galleryId}/countries/{countryId}/cities` - List cities within a country
- `POST /api/places/gallery/{galleryId}/merge-duplicates` - Merge duplicate places (requires admin)

## Face Recognition Features

The face recognition system provides advanced AI-powered features:

- **Automatic Detection**: Photos are automatically scanned for faces
- **Face Grouping**: Similar faces are grouped together using AI
- **Name Assignment**: Assign names to faces for easy searching
- **Face Browsing**: Browse photos by specific people
- **Smart Search**: Find all photos containing specific individuals

Access face features through:
- Face names list: `/g/:galleryId/face-names`
- Photos by face: `/g/:galleryId/face-names/:faceNameId`
- API endpoint: `GET /api/gallery/{galleryId}/face-names/{id}/photos`

## Troubleshooting

### Duplicate Places Issue

If you have multiple place entries for the same city (especially from older versions that used zoom level 14), you can merge them using the merge duplicates feature:

**Via API:**
```bash
# Requires admin authentication
POST /api/places/gallery/{galleryId}/merge-duplicates
```

This will:
- Find places with the same name, parent, and type within the gallery
- Merge them into the oldest place entry
- Reassign all photos and child places to the kept place
- Delete the duplicate entries

The issue was fixed in the current version by changing the OpenStreetMap zoom level from 14 (neighborhood level) to 10 (city level) to ensure only city-level places are returned.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
