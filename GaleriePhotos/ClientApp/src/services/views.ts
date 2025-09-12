
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

export interface Gallery {
    id: number;

    name: string;

    rootDirectory: string;

    thumbnailsDirectory: string | null;

    administratorNames: string[];
}

export interface GalleryCreate {
    name: string;

    rootDirectory: string;

    thumbnailsDirectory: string | null;

    userId: string;
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

export interface User {
    id: string;

    name: string;

    administrator: boolean;
}

export interface UserPatch {
    administrator?: boolean | undefined;
}

export interface GalleryMemberPatch {
    directoryVisibility?: number | undefined;

    isAdministrator?: boolean | undefined;
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

export interface Photo {
    id: number;

    name: string;

    video: boolean;
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
