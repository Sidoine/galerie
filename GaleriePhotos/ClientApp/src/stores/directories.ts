import { ValueLoader, SingletonLoader } from "folke-service-helpers";
import {
    Directory,
    Photo,
    PhotoFull,
    DirectoryPatch,
    PhotoPatch,
} from "../services/views";
import { DirectoryController, PhotoController } from "../services/services";
import { action } from "mobx";

export class DirectoriesStore {
    constructor(
        public loader: ValueLoader<Directory[], number>,
        public contentLoader: ValueLoader<Photo[], number>,
        public imageLoader: ValueLoader<
            PhotoFull,
            { directoryId: number; id: number }
        >,
        public rootLoader: SingletonLoader<Directory>,
        private directoryService: DirectoryController,
        private photoService: PhotoController
    ) {}

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
        if (patch.visible !== undefined) {
            photo.visible = patch.visible;
        }
        await this.photoService.patch(directoryId, photo.id, patch);
    }
}
