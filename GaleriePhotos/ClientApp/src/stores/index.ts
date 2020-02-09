import { DirectoriesStore } from "./directories";
import { AuthorizeService } from "./authorize";
import { SimpleApiClient, ValueLoader } from "folke-service-helpers";
import { DirectoryController } from "../services/services";
import { createContext, useContext } from "react";

interface Stores {
  directoriesStore: DirectoriesStore;
  authorizeService: AuthorizeService;
}

const authorizeService = new AuthorizeService();
const apiClient = new SimpleApiClient({ userManager: authorizeService });
const directoryService = new DirectoryController(apiClient);
const directoriesLoader = new ValueLoader(
  (path: string | null) => directoryService.get(path),
  authorizeService
);
const directoryContentLoader = new ValueLoader(
  (path: string | null) => directoryService.getContent(path),
  authorizeService
);

export const stores: Stores = {
  directoriesStore: new DirectoriesStore(
    directoriesLoader,
    directoryContentLoader
  ),
  authorizeService: authorizeService
};

export const StoreContext = createContext(stores);

export function useStores() {
  return useContext(StoreContext);
}
