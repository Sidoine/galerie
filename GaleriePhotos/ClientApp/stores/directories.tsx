import { MapLoader, useApiClient, ValueLoader } from "folke-service-helpers";
import {
  Directory,
  Photo,
  PhotoFull,
  DirectoryPatch,
  PhotoPatch,
  DirectoryFull,
} from "../services/views";
import { DirectoryController, PhotoController } from "../services/services";
import { action, get, makeObservable, observable } from "mobx";
import { createContext, useContext, useMemo } from "react";
import { getBackendUrl } from "./config";

class DirectoriesStore {
  root: Directory | null = null;
  isInError = false;

  constructor(
    public subDirectoriesLoader: MapLoader<Directory[], [number]>,
    public contentLoader: MapLoader<Photo[], [number]>,
    public imageLoader: ValueLoader<PhotoFull, [number]>,
    public infoLoader: ValueLoader<DirectoryFull, [number]>,
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
      setParentCover: action,
      root: observable,
      isInError: observable,
      setRoot: action,
      loadRoot: action,
    });
    this.loadRoot();
  }

  photoReloadSuffix = new Map<number, number>();

  public async loadRoot() {
    this.isInError = false;
    const result = await this.directoryService.getGalleryRoot(this.galleryId);
    if (result.ok) {
      this.setRoot(result.value);
    } else {
      this.isInError = true;
    }
  }

  setRoot(root: Directory | null) {
    this.root = root;
  }

  getImage(id: number) {
    const result = `${getBackendUrl()}/api/photos/${id}/image`;
    if (this.photoReloadSuffix.has(id)) {
      return `${result}?reload=${this.photoReloadSuffix.get(id)}`;
    }
    return result;
  }

  getThumbnail(id: number) {
    const result = `${getBackendUrl()}/api/photos/${id}/thumbnail`;
    console.log("Getting thumbnail for", id, "->", result);
    if (this.photoReloadSuffix.has(id)) {
      return `${result}?reload=${this.photoReloadSuffix.get(id)}`;
    }
    return result;
  }

  async patchDirectoryAndClearCache(id: number, patch: DirectoryPatch) {
    this.infoLoader.invalidate();
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
    this.infoLoader.invalidate();
    this.subDirectoriesLoader.cache.clear();
  }

  async patchPhoto(photo: Photo, patch: PhotoPatch) {
    await this.photoService.patch(photo.id, patch);
  }

  async setAccess(photo: Photo, isPrivate: boolean) {
    await this.photoService.setAccess(photo.id, {
      private: isPrivate,
    });
    this.contentLoader.cache.clear();
  }

  async rotatePhoto(photo: Photo, angle: number) {
    await this.photoService.rotate(photo.id, { angle });
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
    const directoriesLoader = new MapLoader(directoryService.getSubdirectories);
    const directoryContentLoader = new MapLoader(directoryService.getPhotos);
    const imageLoader = new ValueLoader(photoService.get);
    const directoryInfoLoader = new ValueLoader(directoryService.get);
    return new DirectoriesStore(
      directoriesLoader,
      directoryContentLoader,
      imageLoader,
      directoryInfoLoader,
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
