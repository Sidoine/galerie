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
import { action, makeObservable, observable } from "mobx";
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

    @observable
    photoReloadSuffix = new Map<number, number>();

    @computed
    get root() {
        const value = this.rootLoader.getValue();
        return value;
    }

    getImage(directoryId: number, id: number) {
        const result = `/api/directory/${directoryId}/photos/${id}/image`;
        if (this.photoReloadSuffix.has(id)) {
            return `${result}?reload=${this.photoReloadSuffix.get(id)}`;
        }
        return result;
    }

    getThumbnail(directoryId: number, id: number) {
        const result = `/api/directory/${directoryId}/photos/${id}/thumbnail`;
        if (this.photoReloadSuffix.has(id)) {
            return `${result}?reload=${this.photoReloadSuffix.get(id)}`;
        }
        return result;
    }

    @action
    async patchDirectoryAndClearCache(id: number, patch: DirectoryPatch) {
        this.infoLoader.invalidate();
        this.subDirectoriesLoader.invalidate();
        await this.directoryService.patch(id, patch);
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

    @action
    async setAccess(directoryId: number, photo: Photo, isPrivate: boolean) {
        await this.photoService.setAccess(directoryId, photo.id, {
            private: isPrivate,
        });
        this.contentLoader.invalidate();
    }

    @action
    async rotatePhoto(directoryId: number, photo: Photo, angle: number) {
        await this.photoService.rotate(directoryId, photo.id, { angle });
        this.photoReloadSuffix.set(photo.id, Date.now());
        this.imageLoader.invalidate();
    }
}
