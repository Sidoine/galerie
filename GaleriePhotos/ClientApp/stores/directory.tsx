import {
  BreadCrumb,
  PhotoContainerContext,
  PhotoContainerStore,
} from "./photo-container";
import { useCallback, useMemo } from "react";
import { Href, useRouter } from "expo-router";
import { useDirectoriesStore } from "./directories";
import { observer } from "mobx-react-lite";
import { DirectoryFull } from "@/services/views";

export const DirectoryStoreProvider = observer(function DirectoryStoreProvider({
  children,
  directoryId,
  order = "date-asc",
}: {
  children: React.ReactNode;
  directoryId: number;
  order?: "date-asc" | "date-desc";
}) {
  const router = useRouter();
  const directoriesStore = useDirectoriesStore();
  const galleryId = directoriesStore.galleryId;
  const directory = directoriesStore.infoLoader.getValue(directoryId);
  const getPhotoLink = useCallback(
    (photoId: number): Href => {
      return {
        pathname:
          "/(app)/gallery/[galleryId]/directory/[directoryId]/photos/[photoId]",
        params: {
          galleryId,
          directoryId,
          photoId,
          order,
        },
      };
    },
    [galleryId, directoryId, order]
  );

  const navigateToPhoto = useCallback(
    (photoId: number) => {
      router.push(getPhotoLink(photoId));
    },
    [router, getPhotoLink]
  );

  const navigateToContainer = useCallback(() => {
    router.push(`/gallery/${galleryId}/directory/${directoryId}`);
  }, [galleryId, directoryId, router]);

  const navigateToChildContainer = useCallback(
    (containerId: number) => {
      router.push(`/gallery/${galleryId}/directory/${containerId}`);
    },
    [galleryId, router]
  );

  const navigateToParentContainer = useCallback(() => {
    if (directory !== null) {
      if (directory.parent == null) {
        router.push(`/gallery/${galleryId}`);
        return;
      }
      router.push(`/gallery/${galleryId}/directory/${directory.parent.id}`);
    }
  }, [directory, galleryId, router]);

  const breadCrumbs = useMemo<BreadCrumb[]>(() => {
    const crumbs: BreadCrumb[] = [];
    let current: DirectoryFull | null = directory;
    while (current) {
      crumbs.unshift({
        id: current.id,
        name: current.name || "Tous les albums",
        url: `/gallery/${galleryId}/directory/${current.id}`,
      });
      current = current.parent
        ? directoriesStore.infoLoader.getValue(current.parent.id)
        : null;
    }
    return crumbs;
  }, [directoriesStore.infoLoader, directory, galleryId]);

  const hasParent = directory?.parent != null;
  const photoList = directoriesStore.contentLoader.getValue(directoryId);
  const containersList =
    directoriesStore.subDirectoriesLoader.getValue(directoryId);

  const sort = useCallback(
    (by: "date-asc" | "date-desc") => {
      router.replace({
        pathname: "/gallery/[galleryId]/directory/[directoryId]",
        params: { galleryId, directoryId, order: by },
      });
    },
    [directoryId, galleryId, router]
  );

  const directoryStore = useMemo<PhotoContainerStore>(
    () => ({
      navigateToPhoto,
      navigateToContainer,
      navigateToParentContainer,
      hasParent,
      photoList,
      containersList,
      sort,
      order,
      breadCrumbs,
      container: directory,
      navigateToChildContainer,
      getPhotoLink,
    }),
    [
      navigateToPhoto,
      navigateToContainer,
      navigateToParentContainer,
      hasParent,
      photoList,
      containersList,
      sort,
      order,
      breadCrumbs,
      directory,
      navigateToChildContainer,
      getPhotoLink,
    ]
  );

  return (
    <PhotoContainerContext.Provider value={directoryStore}>
      {children}
    </PhotoContainerContext.Provider>
  );
});
