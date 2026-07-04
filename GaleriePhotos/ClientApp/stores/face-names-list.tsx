import { Href, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { createContext, useCallback, useContext, useMemo } from "react";
import { useFaceNamesStore } from "./face-names";
import {
  BreadCrumb,
  PhotoContainer,
  PhotoContainerStore,
} from "./photo-container";
import { PaginatedPhotosStore } from "./paginated-photos";

const noContainer: PhotoContainer[] = [];

const FaceNamesListStoreContext = createContext<PhotoContainerStore | null>(
  null,
);

export const FaceNamesListStoreProvider = observer(
  function FaceNamesListStoreProvider({
    children,
    order = "date-asc",
  }: {
    children: React.ReactNode;
    order?: "date-asc" | "date-desc";
  }) {
    const router = useRouter();
    const faceNamesStore = useFaceNamesStore();

    const navigateToPhoto = useCallback((photoId: number) => {
      // Photos cannot be accessed directly from the face names list
      console.warn("navigateToPhoto is not supported for face names list");
    }, []);

    const navigateToContainer = useCallback(() => {
      router.replace({
        pathname: "/gallery/[galleryId]/face-names",
        params: {
          galleryId: faceNamesStore.galleryId,
        },
      });
    }, [router, faceNamesStore.galleryId]);

    const getChildContainerLink = useCallback(
      (faceNameId: number): Href => {
        return {
          pathname: "/gallery/[galleryId]/face-names/[faceNameId]",
          params: {
            galleryId: faceNamesStore.galleryId,
            faceNameId,
          },
        };
      },
      [faceNamesStore.galleryId],
    );

    const navigateToChildContainer = useCallback(
      (faceNameId: number) => {
        router.push(getChildContainerLink(faceNameId));
      },
      [router, getChildContainerLink],
    );

    const navigateToParentContainer = useCallback(() => {
      router.back();
    }, [router]);

    const breadCrumbs = useMemo<BreadCrumb[]>(
      () => [
        {
          id: 0,
          name: "Visages",
          url: `/gallery/${faceNamesStore.galleryId}/face-names`,
        },
      ],
      [faceNamesStore.galleryId],
    );

    const sort = useCallback(
      (by: "date-asc" | "date-desc") => {
        router.replace({
          pathname: "/gallery/[galleryId]/face-names",
          params: { galleryId: faceNamesStore.galleryId, order: by },
        });
      },
      [faceNamesStore.galleryId, router],
    );

    const loadPhotos = useCallback(async () => {
      // Face names list doesn't load photos directly
      return null;
    }, []);

    const paginatedPhotosStore = useMemo(() => {
      const sortOrder: "asc" | "desc" = order === "date-asc" ? "asc" : "desc";
      return new PaginatedPhotosStore(loadPhotos, sortOrder);
    }, [loadPhotos, order]);

    const faceNamesListStore = useMemo<PhotoContainerStore>(() => {
      return {
        navigateToPhoto,
        navigateToContainer,
        navigateToParentContainer,
        hasParent: false,
        containersList: noContainer,
        sort,
        order,
        breadCrumbs,
        container: null,
        navigateToChildContainer,
        childContainersHeader: null,
        getChildContainerLink,
        paginatedPhotosStore,
      };
    }, [
      navigateToPhoto,
      navigateToContainer,
      navigateToParentContainer,
      sort,
      order,
      breadCrumbs,
      navigateToChildContainer,
      getChildContainerLink,
      paginatedPhotosStore,
    ]);

    return (
      <FaceNamesListStoreContext.Provider value={faceNamesListStore}>
        {children}
      </FaceNamesListStoreContext.Provider>
    );
  },
);

export function useFaceNamesListStore() {
  const store = useContext(FaceNamesListStoreContext);
  if (!store) {
    throw new Error(
      "useFaceNamesListStore must be used within a FaceNamesListStoreProvider.",
    );
  }
  return store;
}
