import { DirectoriesStore } from "./directories";
import { AuthorizeService } from "./authorize";
import {
    SimpleApiClient,
    ValueLoader,
    SingletonLoader,
} from "folke-service-helpers";
import { DirectoryController, PhotoController } from "../services/services";
import { createContext, useContext } from "react";

interface Stores {
    directoriesStore: DirectoriesStore;
    authorizeService: AuthorizeService;
}

const authorizeService = new AuthorizeService();
const apiClient = new SimpleApiClient({ userManager: authorizeService });
const directoryService = new DirectoryController(apiClient);
const photoService = new PhotoController(apiClient);
const directoriesLoader = new ValueLoader(
    (id: number) => directoryService.get(id),
    authorizeService
);
const rootLoader = new SingletonLoader(
    () => directoryService.getRoot(),
    authorizeService
);
const directoryContentLoader = new ValueLoader(
    (id: number) => directoryService.getContent(id),
    authorizeService
);
const imageLoader = new ValueLoader(
    ({ directoryId, id }: { directoryId: number; id: number }) =>
        photoService.get(directoryId, id),
    authorizeService
);

export const stores: Stores = {
    directoriesStore: new DirectoriesStore(
        directoriesLoader,
        directoryContentLoader,
        imageLoader,
        rootLoader,
        directoryService,
        photoService
    ),
    authorizeService: authorizeService,
};

export const StoreContext = createContext(stores);

export function useStores() {
    return useContext(StoreContext);
}
