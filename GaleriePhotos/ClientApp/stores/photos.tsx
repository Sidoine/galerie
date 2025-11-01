import { MapLoader, useApiClient } from "folke-service-helpers";
import { Photo, PhotoFull, PhotoPatch } from "../services/views";
import { PhotoController } from "../services/services";
import { action, makeObservable, observable } from "mobx";
import { createContext, useContext, useMemo } from "react";
import { getBackendUrl } from "./config";

class PhotosStore {
  constructor(
    public imageLoader: MapLoader<PhotoFull, [number]>,
    private photoService: PhotoController
  ) {
    makeObservable(this, {
      photoReloadSuffix: observable,
      patchPhoto: action,
      setAccess: action,
      rotatePhoto: action,
      toggleFavorite: action,
    });
  }

  photoReloadSuffix = new Map<string, number>();

  clearCache() {
    this.imageLoader.cache.clear();
  }

  getImage(publicId: string) {
    const result = `${getBackendUrl()}/api/photos/${publicId}/image`;
    if (this.photoReloadSuffix.has(publicId)) {
      return `${result}?reload=${this.photoReloadSuffix.get(publicId)}`;
    }
    return result;
  }

  getThumbnail(publicId: string) {
    const result = `${getBackendUrl()}/api/photos/${publicId}/thumbnail`;
    if (this.photoReloadSuffix.has(publicId)) {
      return `${result}?reload=${this.photoReloadSuffix.get(publicId)}`;
    }
    return result;
  }

  async patchPhoto(photo: Photo, patch: PhotoPatch) {
    await this.photoService.patch(photo.id, patch);
  }

  async setAccess(photo: PhotoFull, isPrivate: boolean) {
    photo.private = isPrivate;
    await this.photoService.setAccess(photo.id, {
      private: isPrivate,
    });
  }

  async rotatePhoto(photo: PhotoFull, angle: number) {
    await this.photoService.rotate(photo.id, { angle });
    this.photoReloadSuffix.set(photo.publicId, Date.now());
    this.imageLoader.cache.clear();
  }

  async toggleFavorite(photo: PhotoFull) {
    const response = await this.photoService.toggleFavorite(photo.id);
    if (response.ok) {
      photo.isFavorite = response.value;
      return response.value;
    }
    return photo.isFavorite;
  }
}

const PhotosStoreContext = createContext<PhotosStore | null>(null);

export function PhotosStoreProvider({
  children,
}: {
  children: React.ReactNode;
  galleryId: number;
}) {
  const apiClient = useApiClient();
  const store = useMemo(() => {
    const photoService = new PhotoController(apiClient);
    const imageLoader = new MapLoader(photoService.get);
    return new PhotosStore(imageLoader, photoService);
  }, [apiClient]);
  return (
    <PhotosStoreContext.Provider value={store}>
      {children}
    </PhotosStoreContext.Provider>
  );
}
export function usePhotosStore() {
  const store = useContext(PhotosStoreContext);
  if (!store) throw new Error("No PhotosStoreContext provided");
  return store;
}
