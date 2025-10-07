import { FaceController } from "@/services/face";
import { FaceName, Photo } from "@/services/views";
import { MapLoader, useApiClient, ValueLoader } from "folke-service-helpers";
import { computed, makeObservable } from "mobx";
import { createContext, useContext, useMemo } from "react";

class FaceNamesStore {
  constructor(
    public galleryId: number,
    private namesLoader: ValueLoader<FaceName[], [number]>,
    private nameLoader: MapLoader<FaceName, [number, number]>,
    private namePhotosLoader: MapLoader<Photo[], [number, number]>
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

  getPhotosByName(id: number) {
    return this.namePhotosLoader.getValue(this.galleryId, id);
  }

  getFaceNameThumbnailUrl(id: number) {
    return `/api/gallery/${this.galleryId}/face-names/${id}/thumbnail`;
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
      faceNamePhotosLoader
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
