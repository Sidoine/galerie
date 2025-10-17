import { FaceController } from "@/services/face";
import { FaceName, FaceNameFull, Photo } from "@/services/views";
import { MapLoader, useApiClient, ValueLoader } from "folke-service-helpers";
import { computed, makeObservable } from "mobx";
import { createContext, useContext, useMemo } from "react";

class FaceNamesStore {
  constructor(
    public galleryId: number,
    private namesLoader: ValueLoader<FaceName[], [number]>,
    private nameLoader: MapLoader<FaceNameFull, [number, number]>,
    private namePhotosLoader: MapLoader<
      Photo[],
      [number, number, string?, number?, number?]
    >,
    public faceController: FaceController
  ) {
    makeObservable(this, {
      names: computed,
    });
  }

  get names() {
    return this.namesLoader.getValue(this.galleryId);
  }

  getName(id: number) {
    return this.nameLoader.getValue(this.galleryId, id);
  }

  clearCache() {
    this.namePhotosLoader.cache.clear();
  }

  /**
   * Récupère les photos associées à un nom de visage, avec pagination offset-based.
   */
  getPhotosByName(
    id: number,
    sortOrder?: string,
    offset?: number,
    count?: number
  ) {
    return this.namePhotosLoader.getValue(
      this.galleryId,
      id,
      sortOrder,
      offset,
      count
    );
  }

  getFaceNameThumbnailUrl(id: number) {
    return `/api/gallery/${this.galleryId}/face-names/${id}/thumbnail`;
  }

  async suggestNameForFace(faceId: number) {
    const response = await this.faceController.suggestName(
      this.galleryId,
      faceId,
      { threshold: 0.8 }
    );
    if (response.ok) return response.value.name;
    return null;
  }

  async assignNameToFace(faceId: number, name: string) {
    const response = await this.faceController.assignName(
      this.galleryId,
      faceId,
      { name }
    );
    this.namesLoader.invalidate();
    return response.ok;
  }
}

const FaceNamesStoreContext = createContext<FaceNamesStore | null>(null);

export function FaceNamesStoreProvider({
  children,
  galleryId,
}: {
  children: React.ReactNode;
  galleryId: number;
}) {
  const apiClient = useApiClient();
  const store = useMemo(() => {
    const faceController = new FaceController(apiClient);
    const faceNamesLoader = new ValueLoader(faceController.getNames);
    const faceNameLoader = new MapLoader(faceController.getName);
    const faceNamePhotosLoader = new MapLoader(
      faceController.getPhotosByFaceName
    );
    return new FaceNamesStore(
      Number(galleryId),
      faceNamesLoader,
      faceNameLoader,
      faceNamePhotosLoader,
      faceController
    );
  }, [apiClient, galleryId]);

  return (
    <FaceNamesStoreContext.Provider value={store}>
      {children}
    </FaceNamesStoreContext.Provider>
  );
}

export function useFaceNamesStore() {
  const store = useContext(FaceNamesStoreContext);
  if (!store) {
    throw new Error(
      "useFaceNamesStore must be used within a FaceNamesStoreProvider."
    );
  }
  return store;
}
