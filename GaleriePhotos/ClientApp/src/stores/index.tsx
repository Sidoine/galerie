import { DirectoriesStore } from "./directories";
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
import { createContext, ReactNode, useContext, useMemo } from "react";
import { UsersStore } from "./users";
import { observer } from "mobx-react-lite";

export interface Stores {
    directoriesStore: DirectoriesStore;
    usersStore: UsersStore;
}

export const StoreContext = createContext<Stores | null>(null);

export const StoresProvider = observer(function StoresProvider({
    children,
}: {
    children: ReactNode;
}) {
    const stores = useMemo(() => {
        const apiClient = new SimpleApiClient(null);
        const directoryService = new DirectoryController(apiClient);
        const photoService = new PhotoController(apiClient);
        const directoriesLoader = new ValueLoader(
            directoryService.getSubdirectories
        );
        const usersService = new UserController(apiClient);

        const rootLoader = new SingletonLoader(directoryService.getRoot);
        const directoryContentLoader = new ValueLoader(
            directoryService.getPhotos
        );
        const imageLoader = new ValueLoader(photoService.get);
        const administratorLoader = new SingletonLoader(() =>
            usersService.isAdministrator()
        );
        const directoryInfoLoader = new ValueLoader(directoryService.get);
        const usersLoader = new SingletonLoader(usersService.getAll);

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
            usersStore: new UsersStore(
                administratorLoader,
                usersLoader,
                usersService
            ),
        };
    }, []);

    return (
        <StoreContext.Provider value={stores}>{children}</StoreContext.Provider>
    );
});

export function useStores() {
    const store = useContext(StoreContext);
    if (store === null)
        throw new Error("useStores must be used within StoresProvider");
    return store;
}
