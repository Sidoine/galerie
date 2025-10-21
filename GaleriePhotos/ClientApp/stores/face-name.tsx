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
import { Text } from "react-native";

const noContainer: PhotoContainer[] = [];

const FaceNameStoreContext = createContext<PhotoContainerStore | null>(null);

export const FaceNameStoreProvider = observer(function FaceNameStoreProvider({
  children,
  faceNameId,
  order = "date-asc",
}: {
  children: React.ReactNode;
  faceNameId?: number;
  order?: "date-asc" | "date-desc";
}) {
  const router = useRouter();
  const faceNamesStore = useFaceNamesStore();
  const faceName = faceNameId ? faceNamesStore.getName(faceNameId) : null;
  const getPhotoLink = useCallback(
    (photoId: number): Href => {
      return {
        pathname:
          "/gallery/[galleryId]/face-names/[faceNameId]/photos/[photoId]",
        params: {
          galleryId: faceNamesStore.galleryId,
          faceNameId: faceNameId ?? 0,
          photoId,
          order,
        },
      };
    },
    [faceNamesStore.galleryId, faceNameId, order]
  );
  const navigateToPhoto = useCallback(
    (photoId: number) => {
      router.push(getPhotoLink(photoId));
    },
    [router, getPhotoLink]
  );
  const navigateToContainer = useCallback(() => {
    if (!faceNameId) return;

    router.replace({
      pathname: "/gallery/[galleryId]/face-names/[faceNameId]",
      params: {
        galleryId: faceNamesStore.galleryId,
        faceNameId,
        order,
      },
    });
  }, [router, faceNamesStore.galleryId, faceNameId, order]);
  const getChildContainerLink = useCallback((): Href => {
    // No child container for face names
    return {
      pathname: "/gallery/[galleryId]/face-names",
      params: {
        galleryId: faceNamesStore.galleryId,
      },
    };
  }, [faceNamesStore.galleryId]);
  const navigateToChildContainer = useCallback(() => {
    router.push(getChildContainerLink());
  }, [router, getChildContainerLink]);
  const navigateToParentContainer = useCallback(() => {
    router.push({
      pathname: "/gallery/[galleryId]/face-names",
      params: {
        galleryId: faceNamesStore.galleryId,
      },
    });
  }, [router, faceNamesStore.galleryId]);

  const breadCrumbs = useMemo<BreadCrumb[]>(() => {
    const crumbs: BreadCrumb[] = [
      {
        id: 0,
        name: "Visages",
        url: `/gallery/${faceNamesStore.galleryId}/face-names`,
      },
    ];
    if (faceName && faceNameId) {
      crumbs.push({
        id: faceNameId,
        name: faceName.name,
        url: `/gallery/${faceNamesStore.galleryId}/face-names/${faceNameId}`,
      });
    }
    return crumbs;
  }, [faceName, faceNameId, faceNamesStore.galleryId]);

  const sort = useCallback(
    (order: "date-asc" | "date-desc") => {
      if (!faceNameId) return;

      router.replace({
        pathname: "/gallery/[galleryId]/face-names/[faceNameId]",
        params: {
          galleryId: faceNamesStore.galleryId,
          faceNameId,
          order: order,
        },
      });
    },
    [faceNameId, faceNamesStore.galleryId, router]
  );

  const loadPhotos = useCallback(
    async (sortOrder: string, offset: number, count: number) => {
      if (!faceNameId) return null;
      return await faceNamesStore.faceController.getPhotosByFaceName(
        faceNamesStore.galleryId,
        faceNameId,
        sortOrder,
        offset,
        count
      );
    },
    [faceNameId, faceNamesStore]
  );

  const paginatedPhotosStore = useMemo(() => {
    const sortOrder: "asc" | "desc" = order === "date-asc" ? "asc" : "desc";
    return new PaginatedPhotosStore(faceName, loadPhotos, sortOrder);
  }, [faceName, loadPhotos, order]);

  const faceNameStore = useMemo<PhotoContainerStore>(() => {
    return {
      navigateToPhoto,
      navigateToContainer,
      navigateToParentContainer,
      hasParent: false,
      containersList: noContainer,
      sort,
      order,
      breadCrumbs,
      container: faceName,
      navigateToChildContainer,
      getPhotoLink,
      childContainersHeader: <Text>??</Text>,
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
    faceName,
    navigateToChildContainer,
    getPhotoLink,
    getChildContainerLink,
    paginatedPhotosStore,
  ]);
  return (
    <FaceNameStoreContext.Provider value={faceNameStore}>
      {children}
    </FaceNameStoreContext.Provider>
  );
});

export function useFaceNameStore() {
  const store = useContext(FaceNameStoreContext);
  if (!store) {
    throw new Error(
      "useFaceNameStore must be used within a FaceNameStoreProvider."
    );
  }
  return store;
}
