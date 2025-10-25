import { MapLoader, useApiClient } from "folke-service-helpers";
import {
  Directory,
  Photo,
  DirectoryPatch,
  DirectoryFull,
} from "../services/views";
import { DirectoryController } from "../services/services";
import { action, makeObservable, observable, runInAction } from "mobx";
import { createContext, useContext, useMemo } from "react";

class DirectoriesStore {
  isInError = false;

  constructor(
    public subDirectoriesLoader: MapLoader<Directory[], [number]>,
    public contentLoader: MapLoader<
      Photo[],
      [number, string?, number?, number?, (string | null)?]
    >,
    public infoLoader: MapLoader<DirectoryFull, [number]>,
    public directoryService: DirectoryController,
    public galleryId: number
  ) {
    makeObservable(this, {
      photoReloadSuffix: observable,
      patchDirectoryAndClearCache: action,
      patchDirectory: action,
      setParentCover: action,
      isInError: observable,
    });
  }

  photoReloadSuffix = new Map<string, number>();

  getDirectory(directoryId: number) {
    return this.infoLoader.getValue(directoryId);
  }

  async patchDirectoryAndClearCache(id: number, patch: DirectoryPatch) {
    this.infoLoader.cache.clear();
    this.subDirectoriesLoader.cache.clear();
    await this.directoryService.patch(id, patch);
  }

  async patchDirectory(directory: Directory, patch: DirectoryPatch) {
    if (patch.visibility !== undefined) {
      directory.visibility = patch.visibility;
    }
    await this.directoryService.patch(directory.id, patch);
  }

  async setParentCover(directoryId: number) {
    await this.directoryService.setParentCover(directoryId);
    this.infoLoader.cache.clear();
    this.subDirectoriesLoader.cache.clear();
  }

  async renameDirectory(directoryId: number, newName: string) {
    await this.directoryService.renameDirectory(directoryId, { name: newName });
    runInAction(() => {
      this.infoLoader.cache.clear();
      this.subDirectoriesLoader.cache.clear();
    });
  }

  clearCache() {
    this.contentLoader.cache.clear();
    this.subDirectoriesLoader.cache.clear();
    this.infoLoader.cache.clear();
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
    const directoriesLoader = new MapLoader(directoryService.getSubdirectories);
    const directoryContentLoader = new MapLoader(directoryService.getPhotos);
    const directoryInfoLoader = new MapLoader(directoryService.get);
    return new DirectoriesStore(
      directoriesLoader,
      directoryContentLoader,
      directoryInfoLoader,
      directoryService,
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
