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
import { action } from "mobx";

export class DirectoriesStore {
    constructor(
        public subDirectoriesLoader: ValueLoader<Directory[], number>,
        public contentLoader: ValueLoader<Photo[], number>,
        public imageLoader: ValueLoader<
            PhotoFull,
            { directoryId: number; id: number }
        >,
        public rootLoader: SingletonLoader<Directory>,
        public infoLoader: ValueLoader<DirectoryFull, number>,
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

    @action
    async patchAll(directoryId: number, patch: PhotoPatch) {
        const photos = this.contentLoader.getValue(directoryId);
        if (photos) {
            if (patch.visible !== undefined) {
                for (const photo of photos) photo.visible = patch.visible;
            }
        }
        await this.photoService.patchAll(directoryId, patch);
    }
}
