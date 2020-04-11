import * as enums from "./enums";

export interface Directory {
    id: number;

    visibility: enums.DirectoryVisibility;

    name: string;
}

export interface Photo {
    id: number;

    name: string;

    visible: boolean;
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
}

export interface PhotoPatch {
    visible?: boolean | undefined;
}
