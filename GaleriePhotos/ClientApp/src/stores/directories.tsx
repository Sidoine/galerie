import { useApiClient, ValueLoader } from "folke-service-helpers";
import {
    Directory,
    Photo,
    PhotoFull,
    DirectoryPatch,
    PhotoPatch,
    DirectoryFull,
} from "../services/views";
import { DirectoryController, PhotoController } from "../services/services";
import { action, computed, makeObservable, observable } from "mobx";
import { createContext, useContext, useMemo } from "react";

class DirectoriesStore {
    constructor(
        public subDirectoriesLoader: ValueLoader<Directory[], [number]>,
        public contentLoader: ValueLoader<Photo[], [number]>,
        public imageLoader: ValueLoader<PhotoFull, [number, number]>,
        public infoLoader: ValueLoader<DirectoryFull, [number]>,
        public galleryRootLoader: ValueLoader<Directory, [number]>,
        private directoryService: DirectoryController,
        private photoService: PhotoController,
        public galleryId: number
    ) {
        makeObservable(this, {
            photoReloadSuffix: observable,
            patchDirectoryAndClearCache: action,
            patchDirectory: action,
            patchPhoto: action,
            setAccess: action,
            rotatePhoto: action,
            root: computed,
        });
    }

    photoReloadSuffix = new Map<number, number>();

    get root() {
        return this.galleryRootLoader.getValue(this.galleryId);
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

    async patchDirectoryAndClearCache(id: number, patch: DirectoryPatch) {
        this.infoLoader.invalidate();
        this.subDirectoriesLoader.invalidate();
        await this.directoryService.patch(id, patch);
    }

    async patchDirectory(directory: Directory, patch: DirectoryPatch) {
        if (patch.visibility !== undefined) {
            directory.visibility = patch.visibility;
        }
        await this.directoryService.patch(directory.id, patch);
    }

    async patchPhoto(directoryId: number, photo: Photo, patch: PhotoPatch) {
        await this.photoService.patch(directoryId, photo.id, patch);
    }

    async setAccess(directoryId: number, photo: Photo, isPrivate: boolean) {
        await this.photoService.setAccess(directoryId, photo.id, {
            private: isPrivate,
        });
        this.contentLoader.invalidate();
    }

    async rotatePhoto(directoryId: number, photo: Photo, angle: number) {
        await this.photoService.rotate(directoryId, photo.id, { angle });
        this.photoReloadSuffix.set(photo.id, Date.now());
        this.imageLoader.invalidate();
    }
}

const DirectoriesStoreContext = createContext<DirectoriesStore | null>(null);

export function DirectoriesStoreProvider({
    children,
    galleryId,
}: {
    children: React.ReactNode;
    galleryId: number;
}) {
    const apiClient = useApiClient();
    const store = useMemo(() => {
        const directoryService = new DirectoryController(apiClient);
        const photoService = new PhotoController(apiClient);
        const directoriesLoader = new ValueLoader(
            directoryService.getSubdirectories
        );
        const directoryContentLoader = new ValueLoader(
            directoryService.getPhotos
        );
        const imageLoader = new ValueLoader(photoService.get);
        const directoryInfoLoader = new ValueLoader(directoryService.get);
        const galleryRootLoader = new ValueLoader(
            directoryService.getGalleryRoot
        );
        return new DirectoriesStore(
            directoriesLoader,
            directoryContentLoader,
            imageLoader,
            directoryInfoLoader,
            galleryRootLoader,
            directoryService,
            photoService,
            galleryId
        );
    }, [apiClient, galleryId]);
    return (
        <DirectoriesStoreContext.Provider value={store}>
            {children}
        </DirectoriesStoreContext.Provider>
    );
}
export function useDirectoriesStore() {
    const store = useContext(DirectoriesStoreContext);
    if (!store) throw new Error("No DirectoriesStoreContext provided");
    return store;
}
