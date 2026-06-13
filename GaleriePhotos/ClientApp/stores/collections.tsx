import { createContext, useCallback, useContext, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { Href, useRouter } from "expo-router";
import { useApiClient } from "folke-service-helpers";
import { PaginatedPhotosStore, LoadPhotosFunction } from "./paginated-photos";
import {
  BreadCrumb,
  PhotoContainerStore,
  SearchContainerFull,
} from "./photo-container";
import { CollectionController } from "@/services/collection";
import { Alert } from "react-native";

const CollectionsStoreContext = createContext<{
  galleryId: number;
  collectionId: number;
  containerStore: PhotoContainerStore;
} | null>(null);

export const CollectionsStoreProvider = observer(
  function CollectionsStoreProvider({
    children,
    galleryId,
    collectionId,
    collectionName = "Collection",
    order = "date-desc",
  }: {
    children: React.ReactNode;
    galleryId: number;
    collectionId: number;
    collectionName?: string;
    order?: "date-asc" | "date-desc";
  }) {
    const router = useRouter();
    const apiClient = useApiClient();

    const getPhotoLink = useCallback(
      (photoId: number): Href => ({
        pathname:
          "/gallery/[galleryId]/collections/[collectionId]/photos/[photoId]",
        params: { order, galleryId, collectionId, photoId },
      }),
      [galleryId, collectionId, order],
    );

    const navigateToPhoto = useCallback(
      (photoId: number) => router.push(getPhotoLink(photoId)),
      [router, getPhotoLink],
    );

    const navigateToContainer = useCallback(() => {
      router.replace({
        pathname: `/gallery/[galleryId]/collections/[collectionId]`,
        params: { order, galleryId, collectionId },
      });
    }, [router, galleryId, collectionId, order]);

    const navigateToParentContainer = useCallback(() => {
      router.back();
    }, [router]);

    const navigateToChildContainer = useCallback((containerId: number) => {
      void containerId; // Collections don't expose child containers
    }, []);

    const getChildContainerLink = useCallback(
      (): Href => ({
        pathname: `/gallery/[galleryId]/collections/[collectionId]`,
        params: { order, galleryId, collectionId },
      }),
      [galleryId, collectionId, order],
    );

    const getSlideshowLink = useCallback(
      (): Href => ({
        pathname: `/gallery/[galleryId]/collections/[collectionId]/slideshow`,
        params: { order, galleryId, collectionId },
      }),
      [galleryId, collectionId, order],
    );

    const breadCrumbs = useMemo<BreadCrumb[]>(
      () => [
        {
          id: collectionId,
          name: collectionName,
          url: {
            pathname: `/gallery/[galleryId]/collections/[collectionId]`,
            params: { order, galleryId, collectionId },
          },
        },
      ],
      [galleryId, collectionId, collectionName, order],
    );

    const collectionController = useMemo(
      () => new CollectionController(apiClient),
      [apiClient],
    );

    const loadPhotos = useCallback<LoadPhotosFunction>(
      (
        sortOrder: string,
        offset: number,
        count: number,
        startDate?: string | null,
      ) =>
        collectionController.getCollectionPhotos(
          galleryId,
          collectionId,
          sortOrder,
          offset,
          count,
          startDate,
        ),
      [collectionController, galleryId, collectionId],
    );

    const paginatedPhotosStore = useMemo(() => {
      const sortOrderValue: "asc" | "desc" =
        order === "date-asc" ? "asc" : "desc";
      return new PaginatedPhotosStore(loadPhotos, sortOrderValue);
    }, [loadPhotos, order]);

    const deletePhotosFromAlbum = useCallback(
      async (photoIds: number[]) => {
        if (photoIds.length === 0) {
          Alert.alert("Erreur", "Aucune photo sélectionnée");
          return;
        }

        const response = await collectionController.removePhotosFromCollection(
          galleryId,
          collectionId,
          {
            photoIds,
          },
        );

        if (response.ok) {
          paginatedPhotosStore.clear();
          await paginatedPhotosStore.loadMore();
          Alert.alert(
            "Succès",
            `${photoIds.length} photo${photoIds.length > 1 ? "s" : ""} retirée${photoIds.length > 1 ? "s" : ""} de la collection`,
          );
        } else {
          Alert.alert(
            "Erreur",
            "Une erreur est survenue lors de la suppression",
          );
        }
      },
      [collectionController, galleryId, collectionId, paginatedPhotosStore],
    );

    const container = useMemo<SearchContainerFull>(() => {
      const dates = paginatedPhotosStore.photos.map((photo) => photo.dateTime);
      const computeBoundary = (comparator: (a: string, b: string) => boolean) =>
        dates.reduce<string | null>((current, date) => {
          if (!current) return date;
          return comparator(date, current) ? date : current;
        }, null);

      const minDate = computeBoundary((a, b) => new Date(a) < new Date(b));
      const maxDate = computeBoundary((a, b) => new Date(a) > new Date(b));

      return {
        id: collectionId,
        name: collectionName,
        numberOfPhotos: paginatedPhotosStore.photos.length,
        minDate,
        maxDate,
        coverPhotoId: null,
        dateJumps: [],
      };
    }, [paginatedPhotosStore.photos, collectionId, collectionName]);

    const sort = useCallback(
      (order: "date-asc" | "date-desc") => {
        router.replace({
          pathname: `/gallery/[galleryId]/collections/[collectionId]`,
          params: { galleryId, collectionId, order },
        });
      },
      [galleryId, collectionId, router],
    );

    const containerStore = useMemo<PhotoContainerStore>(
      () => ({
        navigateToPhoto,
        navigateToContainer,
        navigateToParentContainer,
        navigateToChildContainer,
        hasParent: true,
        containersList: null,
        sort,
        order,
        breadCrumbs,
        container,
        getPhotoLink,
        deletePhotosFromAlbum,
        deletePhotosFromAlbumLabel: "Supprimer de la collection",
        childContainersHeader: null,
        getChildContainerLink,
        paginatedPhotosStore,
        getSlideshowLink,
      }),
      [
        navigateToPhoto,
        navigateToContainer,
        navigateToParentContainer,
        navigateToChildContainer,
        sort,
        order,
        breadCrumbs,
        container,
        getPhotoLink,
        deletePhotosFromAlbum,
        getChildContainerLink,
        paginatedPhotosStore,
        getSlideshowLink,
      ],
    );

    const collectionsStore = useMemo(
      () => ({
        galleryId,
        collectionId,
        containerStore,
      }),
      [galleryId, collectionId, containerStore],
    );

    return (
      <CollectionsStoreContext.Provider value={collectionsStore}>
        {children}
      </CollectionsStoreContext.Provider>
    );
  },
);

export const useCollectionsStore = () => {
  const store = useContext(CollectionsStoreContext);
  if (!store) {
    throw new Error(
      "useCollectionsStore must be used within CollectionsStoreProvider",
    );
  }
  return store;
};
