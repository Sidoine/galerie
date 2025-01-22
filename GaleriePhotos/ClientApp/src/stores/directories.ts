import { ValueLoader, SingletonLoader } from "folke-service-helpers";
import {
    Directory,
    Photo,
    PhotoFull,
    DirectoryPatch,
    PhotoPatch,
    DirectoryFull,
} from "../services/views";
import { DirectoryController, PhotoController } from "../services/services";
import { action, makeObservable } from "mobx";
import { computed } from "mobx";

export class DirectoriesStore {
    constructor(
        public subDirectoriesLoader: ValueLoader<Directory[], [number]>,
        public contentLoader: ValueLoader<Photo[], [number]>,
        public imageLoader: ValueLoader<PhotoFull, [number, number]>,
        public rootLoader: SingletonLoader<Directory>,
        public infoLoader: ValueLoader<DirectoryFull, [number]>,
        private directoryService: DirectoryController,
        private photoService: PhotoController
    ) {
        makeObservable(this);
    }

    @computed
    get root() {
        const value = this.rootLoader.getValue();
        return value;
    }

    getImage(directoryId: number, id: number) {
        return `/api/directory/${directoryId}/photos/${id}/image`;
    }

    getThumbnail(directoryId: number, id: number) {
        return `/api/directory/${directoryId}/photos/${id}/thumbnail`;
    }

    @action
    async patchDirectory(directory: Directory, patch: DirectoryPatch) {
        if (patch.visibility !== undefined) {
            directory.visibility = patch.visibility;
        }
        await this.directoryService.patch(directory.id, patch);
    }

    @action
    async patchPhoto(directoryId: number, photo: Photo, patch: PhotoPatch) {
        await this.photoService.patch(directoryId, photo.id, patch);
    }
}
