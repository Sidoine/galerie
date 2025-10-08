import { Href, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { createContext, useCallback, useContext, useMemo } from "react";
import { useFaceNamesStore } from "./face-names";
import {
  BreadCrumb,
  PhotoContainer,
  PhotoContainerStore,
} from "./photo-container";
import { Photo } from "@/services/views";

const noPhoto: Photo[] = [];
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
    router.push({
      pathname: "/gallery/[galleryId]/face-names/[faceNameId]",
      params: {
        galleryId: faceNamesStore.galleryId,
        faceNameId,
        order,
      },
    });
  }, [router, faceNamesStore.galleryId, faceNameId, order]);
  const navigateToChildContainer = useCallback(() => {}, []);
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

  const photoList = faceNameId
    ? faceNamesStore.getPhotosByName(faceNameId)
    : noPhoto;

  const faceNameStore = useMemo<PhotoContainerStore>(() => {
    return {
      navigateToPhoto,
      navigateToContainer,
      navigateToParentContainer,
      hasParent: false,
      photoList,
      containersList: noContainer,
      sort,
      order,
      breadCrumbs,
      container: faceName,
      navigateToChildContainer,
      getPhotoLink,
    };
  }, [
    breadCrumbs,
    faceName,
    navigateToChildContainer,
    navigateToContainer,
    navigateToParentContainer,
    navigateToPhoto,
    order,
    photoList,
    sort,
    getPhotoLink,
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
