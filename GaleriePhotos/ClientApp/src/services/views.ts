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
}

export interface DirectoryFull {
    parent: Directory | null;

    id: number;

    visibility: enums.DirectoryVisibility;

    name: string;
}

export interface Photo {
    id: number;

    name: string;

    visible: boolean;

    video: boolean;
}

export interface DirectoryPatch {
    visibility?: enums.DirectoryVisibility | undefined;
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

    visible: boolean;

    video: boolean;

    nextVisibleId: number | null;

    previousVisibleId: number | null;
}

export interface PhotoPatch {
    visible?: boolean | undefined;
}
