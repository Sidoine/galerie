import * as enums from "./enums";

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
}

export interface UnnamedFacesSampleRequest {
    count: number;
}

export interface FaceName {
    id: number;

    name: string;
}

export interface Photo {
    id: number;

    name: string;

    video: boolean;

    directoryId: number;
}

export interface FaceNameSuggestionRequest {
    threshold: number;
}

export interface FaceNameSuggestionResponse {
    name: string | null;
}

export interface Gallery {
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

export interface User {
    id: string;

    name: string;

    administrator: boolean;
}

export interface UserPatch {
    administrator?: boolean | undefined;
}

export interface Directory {
    id: number;

    visibility: number;

    name: string;

    coverPhotoId: number | null;

    numberOfPhotos: number;

    numberOfSubDirectories: number;
}

export interface DirectoryFull {
    parent: Directory | null;

    id: number;

    visibility: number;

    name: string;

    coverPhotoId: number | null;

    numberOfPhotos: number;

    numberOfSubDirectories: number;
}

export interface DirectoryPatch {
    visibility?: number | undefined;

    coverPhotoId?: number | undefined;
}

export interface PhotoFull {
    id: number;

    name: string;

    nextId: number | null;

    previousId: number | null;

    dateTime: string | null;

    latitude: number | null;

    longitude: number | null;

    camera: string | null;

    video: boolean;

    private: boolean;

    faceDetectionStatus: enums.FaceDetectionStatus;

    directoryId: number;
}

export interface PhotoPatch {
    visible?: boolean | undefined;
}

export interface PhotoAccess {
    private: boolean;
}

export interface PhotoRotate {
    angle: number;
}
