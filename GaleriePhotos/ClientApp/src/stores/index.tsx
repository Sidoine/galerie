import { DirectoriesStore } from "./directories";
import {
    SimpleApiClient,
    ValueLoader,
    SingletonLoader,
    AuthorizeService,
    useAuthorize,
} from "folke-service-helpers";
import {
    DirectoryController,
    PhotoController,
    UserController,
} from "../services/services";
import React, { createContext, ReactNode, useContext, useMemo } from "react";
import { UsersStore } from "./users";

export interface Stores {
    directoriesStore: DirectoriesStore;
    usersStore: UsersStore;
}

export const StoreContext = createContext<Stores | null>(null);

export function StoresProvider({ children }: { children: ReactNode }) {
    const authorizeService = useAuthorize();
    const stores = useMemo(() => {
        const apiClient = new SimpleApiClient(authorizeService);
        const directoryService = new DirectoryController(apiClient);
        const photoService = new PhotoController(apiClient);
        const directoriesLoader = new ValueLoader(
            directoryService.getSubdirectories,
            authorizeService
        );
        const usersService = new UserController(apiClient);

        const rootLoader = new SingletonLoader(
            directoryService.getRoot,
            authorizeService
        );
        const directoryContentLoader = new ValueLoader(
            directoryService.getPhotos,
            authorizeService
        );
        const imageLoader = new ValueLoader(photoService.get, authorizeService);
        const administratorLoader = new SingletonLoader(
            () => usersService.isAdministrator(),
            authorizeService
        );
        const directoryInfoLoader = new ValueLoader(
            directoryService.get,
            authorizeService
        );
        const usersLoader = new SingletonLoader(
            usersService.getAll,
            authorizeService
        );

        return {
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
            usersStore: new UsersStore(
                administratorLoader,
                usersLoader,
                usersService,
                authorizeService
            ),
        };
    }, [authorizeService]);

    return (
        <StoreContext.Provider value={stores}>{children}</StoreContext.Provider>
    );
}

export function useStores() {
    const store = useContext(StoreContext);
    if (store === null)
        throw new Error("useStores must be used within StoresProvider");
    return store;
}
