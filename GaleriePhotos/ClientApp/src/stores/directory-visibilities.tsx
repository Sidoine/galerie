import { useApiClient, ValueLoader } from "folke-service-helpers";
import {
    GalleryDirectoryVisibility,
    GalleryDirectoryVisibilityPatch,
    GalleryDirectoryVisibilityCreate,
} from "../services/views";
import { DirectoryVisibilityController } from "../services/services";
import { action, computed, makeObservable } from "mobx";
import { createContext, useContext, useMemo } from "react";

class DirectoryVisibilitiesStore {
    constructor(
        public visibilitiesLoader: ValueLoader<
            GalleryDirectoryVisibility[],
            [number]
        >,
        private directoryVisibilityService: DirectoryVisibilityController,
        public galleryId: number
    ) {
        makeObservable(this, {
            visibilities: computed,
            createVisibility: action,
            updateVisibility: action,
            deleteVisibility: action,
        });
    }

    get visibilities() {
        return this.visibilitiesLoader.getValue(this.galleryId) || [];
    }

    async createVisibility(visibility: GalleryDirectoryVisibilityCreate) {
        const result = await this.directoryVisibilityService.post(
            this.galleryId,
            visibility
        );
        if (result.ok) {
            this.visibilitiesLoader.invalidate();
            return result.value;
        }
        throw new Error(result.message);
    }

    async updateVisibility(id: number, patch: GalleryDirectoryVisibilityPatch) {
        const result = await this.directoryVisibilityService.update(
            this.galleryId,
            id,
            patch
        );
        if (result.ok) {
            this.visibilitiesLoader.invalidate();
            return result.value;
        }
        throw new Error(result.message);
    }

    async deleteVisibility(id: number) {
        const result = await this.directoryVisibilityService.delete(
            this.galleryId,
            id
        );
        if (result.ok) {
            this.visibilitiesLoader.invalidate();
        }
    }

    getVisibilityByValue(value: number) {
        return this.visibilities.find((v) => v.value === value);
    }

    getVisibilitiesForFlags(flags: number) {
        return this.visibilities.filter((v) => (flags & v.value) !== 0);
    }
}

const DirectoryVisibilitiesStoreContext =
    createContext<DirectoryVisibilitiesStore | null>(null);

export function DirectoryVisibilitiesStoreProvider({
    children,
    galleryId,
}: {
    children: React.ReactNode;
    galleryId: number;
}) {
    const apiClient = useApiClient();

    const store = useMemo(() => {
        const directoryVisibilityService = new DirectoryVisibilityController(
            apiClient
        );
        const visibilitiesLoader = new ValueLoader((galleryId: number) =>
            directoryVisibilityService.getAll(galleryId)
        );

        return new DirectoryVisibilitiesStore(
            visibilitiesLoader,
            directoryVisibilityService,
            galleryId
        );
    }, [apiClient, galleryId]);

    return (
        <DirectoryVisibilitiesStoreContext.Provider value={store}>
            {children}
        </DirectoryVisibilitiesStoreContext.Provider>
    );
}

export function useDirectoryVisibilitiesStore() {
    const store = useContext(DirectoryVisibilitiesStoreContext);
    if (!store) {
        throw new Error(
            "useDirectoryVisibilitiesStore must be used within DirectoryVisibilitiesStoreProvider"
        );
    }
    return store;
}
