
export enum FaceDetectionStatus {
    NotStarted = 0,

    InProgress = 1,

    Completed = 2,

    Failed = 3,

    Skipped = 4
}

export enum PlaceType {
    Country = 1,

    City = 2,

    Town = 3,

    Village = 4,

    Hamlet = 5
}

export enum DataProviderType {
    FileSystem = 0,

    Seafile = 1
}
