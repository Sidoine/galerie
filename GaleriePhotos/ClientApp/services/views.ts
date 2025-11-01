import * as enums from "./enums";

export interface Directory {
    id: number;

    visibility: number;

    name: string;

    coverPhotoId: string | null;

    numberOfPhotos: number;

    numberOfSubDirectories: number;
}

export interface DateJump {
    type: enums.DateJumpType;

    date: string;

    label: string;
}

export interface DirectoryFull {
    parent: Directory | null;

    minDate: string;

    maxDate: string;

    dateJumps: DateJump[];

    id: number;

    visibility: number;

    name: string;

    coverPhotoId: string | null;

    numberOfPhotos: number;

    numberOfSubDirectories: number;
}

export interface PlaceShort {
    id: number;

    name: string;
}

export interface Photo {
    id: number;

    publicId: string;

    name: string;

    video: boolean;

    directoryId: number;

    dateTime: string;

    place: PlaceShort | null;

    isFavorite: boolean;
}

export interface DirectoryPatch {
    visibility?: number | undefined;

    coverPhotoId?: number | undefined;

    name?: string | undefined;
}

export interface DirectoryCreate {
    name: string;

    photoIds: number[];
}

export interface DirectoryRename {
    name: string;
}

export interface AddressGeocodeRequest {
    address: string;
}

export interface AddressGeocodeResponse {
    latitude: number | null;

    longitude: number | null;

    formattedAddress: string | null;

    success: boolean;

    error: string | null;
}

export interface PhotoFull {
    id: number;

    publicId: string;

    name: string;

    description: string | null;

    nextId: number | null;

    previousId: number | null;

    dateTime: string;

    latitude: number | null;

    longitude: number | null;

    camera: string | null;

    video: boolean;

    private: boolean;

    faceDetectionStatus: enums.FaceDetectionStatus;

    directoryId: number;

    isFavorite: boolean;

    place: PlaceShort | null;
}

export interface PhotoPatch {
    visible?: boolean | undefined;

    description?: string | undefined;
}

export interface PhotoAccess {
    private: boolean;
}

export interface PhotoRotate {
    angle: number;
}

export interface PhotoBulkUpdateLocation {
    photoIds: number[];

    latitude: number;

    longitude: number;

    overwriteExisting: boolean;
}

export interface PhotoBulkUpdateDate {
    photoIds: number[];

    dateTime: string;
}

export interface PhotoMove {
    photoIds: number[];

    targetDirectoryId: number;
}

export interface Place {
    id: number;

    name: string;

    latitude: number;

    longitude: number;

    numberOfPhotos: number;

    type: enums.PlaceType;

    parentId: number | null;

    coverPhotoId: string | null;

    galleryId: number;
}

export interface PlaceFull {
    minDate: string;

    maxDate: string;

    dateJumps: DateJump[];

    id: number;

    name: string;

    latitude: number;

    longitude: number;

    numberOfPhotos: number;

    type: enums.PlaceType;

    parentId: number | null;

    coverPhotoId: string | null;

    galleryId: number;
}

export interface AlbumWithoutGpsInfo {
    directoryId: number;

    directoryPath: string;

    missingGpsPhotoCount: number;
}

export interface AutoNamedFaceSampleInfo {
    faceId: number;

    autoNamedFromFaceId: number;
}

export interface DashboardStatistics {
    photosWithoutGpsCount: number;

    albumsWithPhotosWithoutGpsCount: number;

    albumsWithoutGps: AlbumWithoutGpsInfo[];

    autoNamedFacesCount: number;

    autoNamedFaceSamples: AutoNamedFaceSampleInfo[];
}

export interface GpsBackfillProgress {
    totalPhotosWithoutGps: number;

    processedCount: number;

    lastProcessedPhotoId: number;
}

export interface GalleryDirectoryVisibility {
    id: number;

    name: string;

    icon: string;

    value: number;

    galleryId: number;
}

export interface GalleryDirectoryVisibilityCreate {
    name: string;

    icon: string;

    value: number;
}

export interface GalleryDirectoryVisibilityPatch {
    name: string | null;

    icon: string | null;

    value: number | null;
}

export interface FaceAssignName {
    name: string;
}

export interface SimilarFacesRequest {
    name: string;

    limit: number;
}

export interface Face {
    id: number;

    photoId: number;

    x: number;

    y: number;

    width: number;

    height: number;

    name: string | null;

    createdAt: string;

    namedAt: string | null;

    autoNamedFromFaceId: number | null;
}

export interface UnnamedFacesSampleRequest {
    count: number;
}

export interface FaceName {
    id: number;

    name: string;

    numberOfPhotos: number;

    coverPhotoId: string | null;
}

export interface FaceNameFull {
    minDate: string;

    maxDate: string;

    dateJumps: DateJump[];

    id: number;

    name: string;

    numberOfPhotos: number;

    coverPhotoId: string | null;
}

export interface FaceNameSuggestionRequest {
    threshold: number;
}

export interface FaceNameSuggestionResponse {
    name: string | null;
}

export interface AutoNamedFacePair {
    faceId: number;

    photoId: number;

    name: string | null;

    x: number;

    y: number;

    width: number;

    height: number;

    namedAt: string | null;

    referenceFaceId: number;

    referencePhotoId: number;

    referenceX: number;

    referenceY: number;

    referenceWidth: number;

    referenceHeight: number;
}

export interface FaceNameUpdate {
    name: string;
}

export interface GalleryFull {
    minDate: string;

    maxDate: string;

    isAdministrator: boolean;

    dateJumps: DateJump[];

    id: number;

    name: string;

    rootDirectoryId: number;

    numberOfPhotos: number;

    coverPhotoId: string | null;
}

export interface GallerySettings {
    id: number;

    name: string;

    rootDirectory: string;

    thumbnailsDirectory: string | null;

    dataProvider: enums.DataProviderType;

    seafileServerUrl: string | null;

    seafileApiKey: string | null;

    administratorNames: string[];
}

export interface GalleryCreate {
    name: string;

    rootDirectory: string;

    thumbnailsDirectory: string;

    dataProvider: enums.DataProviderType;

    seafileServerUrl: string | null;

    seafileApiKey: string | null;

    userId: string;
}

export interface GalleryPatch {
    name: string | null;

    rootDirectory: string | null;

    thumbnailsDirectory: string | null;

    dataProvider: enums.DataProviderType | null;

    seafileServerUrl: string | null;

    seafileApiKey: string | null;
}

export interface SeafileApiKeyRequest {
    username: string;

    password: string;
}

export interface SeafileApiKeyResponse {
    apiKey: string;
}

export interface SeafileRepositoriesRequest {
    apiKey: string;

    serverUrl: string;
}

export interface SeafileRepository {
    id: string;

    name: string;

    size: number;

    permission: string;

    encrypted: boolean;

    owner: string;
}

export interface SeafileRepositoriesResponse {
    repositories: SeafileRepository[];
}

export interface GalleryMember {
    id: number;

    galleryId: number;

    galleryName: string;

    userId: string;

    userName: string;

    directoryVisibility: number;

    isAdministrator: boolean;
}

export interface GalleryMemberPatch {
    directoryVisibility?: number | undefined;

    isAdministrator?: boolean | undefined;
}

export interface Gallery {
    id: number;

    name: string;

    rootDirectoryId: number;

    numberOfPhotos: number;

    coverPhotoId: string | null;
}

export interface User {
    id: string;

    name: string;

    administrator: boolean;
}

export interface RecentSearch {
    query: string;

    createdAtUtc: string;
}

export interface RecentSearchCreate {
    query: string;
}

export interface SearchResultFull {
    numberOfPhotos: number;

    minDate: string | null;

    maxDate: string | null;

    coverPhotoId: string | null;

    name: string;

    dateJumps: DateJump[];
}

export interface UserPatch {
    administrator?: boolean | undefined;
}
