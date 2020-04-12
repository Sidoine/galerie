import { DirectoriesStore } from "./directories";
import { AuthorizeService } from "./authorize";
import {
    SimpleApiClient,
    ValueLoader,
    SingletonLoader,
} from "folke-service-helpers";
import {
    DirectoryController,
    PhotoController,
    UserController,
} from "../services/services";
import { createContext, useContext } from "react";
import { UsersStore } from "./users";

const authorizeService = new AuthorizeService();
const apiClient = new SimpleApiClient({ userManager: authorizeService });
const directoryService = new DirectoryController(apiClient);
const photoService = new PhotoController(apiClient);
const directoriesLoader = new ValueLoader(
    (id: number) => directoryService.getSubdirectories(id),
    authorizeService
);
const usersService = new UserController(apiClient);

const rootLoader = new SingletonLoader(
    () => directoryService.getRoot(),
    authorizeService
);
const directoryContentLoader = new ValueLoader(
    (id: number) => directoryService.getPhotos(id),
    authorizeService
);
const imageLoader = new ValueLoader(
    ({ directoryId, id }: { directoryId: number; id: number }) =>
        photoService.get(directoryId, id),
    authorizeService
);
const administratorLoader = new SingletonLoader(() =>
    usersService.isAdministrator()
);
const directoryInfoLoader = new ValueLoader((id: number) =>
    directoryService.get(id)
);
const usersLoader = new SingletonLoader(() => usersService.getAll());

export const stores = {
    directoriesStore: new DirectoriesStore(
        directoriesLoader,
        directoryContentLoader,
        imageLoader,
        rootLoader,
        directoryInfoLoader,
        directoryService,
        photoService
    ),
    authorizeService: authorizeService,
    usersStore: new UsersStore(administratorLoader, usersLoader, usersService),
};

export type Stores = typeof stores;

export const StoreContext = createContext(stores);

export function useStores() {
    return useContext(StoreContext);
}
