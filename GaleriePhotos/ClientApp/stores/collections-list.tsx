import { createContext, useCallback, useContext, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useApiClient } from "folke-service-helpers";
import { CollectionController } from "@/services/collection";
import { PhotoCollection } from "@/services/views";
import { action, makeObservable, observable } from "mobx";

class CollectionsListStore {
  collections: PhotoCollection[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(
    private galleryId: number,
    private collectionController: CollectionController,
  ) {
    makeObservable(this, {
      collections: observable,
      isLoading: observable,
      error: observable,
      loadCollections: action,
    });
  }

  async loadCollections() {
    this.isLoading = true;
    this.error = null;
    try {
      const result = await this.collectionController.getCollections(
        this.galleryId,
      );
      if (result.ok) {
        this.collections = (result as any).value || [];
      } else {
        this.error = result.message || "Failed to load collections";
      }
    } catch (err) {
      this.error =
        err instanceof Error ? err.message : "Failed to load collections";
    } finally {
      this.isLoading = false;
    }
  }
}

const CollectionsListStoreContext = createContext<CollectionsListStore | null>(
  null,
);

export const CollectionsListStoreProvider = observer(
  function CollectionsListStoreProvider({
    children,
    galleryId,
  }: {
    children: React.ReactNode;
    galleryId: number;
  }) {
    const apiClient = useApiClient();

    const collectionController = useMemo(
      () => new CollectionController(apiClient),
      [apiClient],
    );

    const store = useMemo(() => {
      return new CollectionsListStore(galleryId, collectionController);
    }, [galleryId, collectionController]);

    return (
      <CollectionsListStoreContext.Provider value={store}>
        {children}
      </CollectionsListStoreContext.Provider>
    );
  },
);

export const useCollectionsListStore = () => {
  const store = useContext(CollectionsListStoreContext);
  if (!store) {
    throw new Error(
      "useCollectionsListStore must be used within CollectionsListStoreProvider",
    );
  }
  return store;
};
