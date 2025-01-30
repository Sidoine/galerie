import * as enums from "./enums";

export interface User {
    id: string;

    name: string;

    administrator: boolean;

    directoryVisibility: enums.DirectoryVisibility;
}

export interface UserPatch {
    administrator?: boolean | undefined;

    directoryVisibility?: enums.DirectoryVisibility | undefined;
}

export interface Directory {
    id: number;

    visibility: enums.DirectoryVisibility;

    name: string;

    coverPhotoId: number | null;

    numberOfPhotos: number;

    numberOfSubDirectories: number;
}

export interface DirectoryFull {
    parent: Directory | null;

    id: number;

    visibility: enums.DirectoryVisibility;

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
    visibility?: enums.DirectoryVisibility | undefined;

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
