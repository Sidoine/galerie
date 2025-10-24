import { BreadCrumb, PhotoContainerStore } from "./photo-container";
import { createContext, useCallback, useContext, useMemo } from "react";
import { Href, useRouter } from "expo-router";
import { useDirectoriesStore } from "./directories";
import { observer } from "mobx-react-lite";
import { LoadPhotosFunction, PaginatedPhotosStore } from "./paginated-photos";
import { useGalleryStore } from "./gallery";

const DirectoryStoreContext = createContext<PhotoContainerStore | null>(null);

export const DirectoryStoreProvider = observer(function DirectoryStoreProvider({
  children,
  directoryId,
  order = "date-asc",
}: {
  children: React.ReactNode;
  directoryId: number | "index" | undefined;
  order?: "date-asc" | "date-desc";
}) {
  const router = useRouter();
  const directoriesStore = useDirectoriesStore();
  const galleryStore = useGalleryStore();
  const galleryId = directoriesStore.galleryId;
  if (directoryId === "index" || directoryId === undefined) {
    directoryId = galleryStore.gallery?.rootDirectoryId;
  }
  const directory = directoryId
    ? directoriesStore.infoLoader.getValue(directoryId)
    : null;
  if (directory !== null && directoryId === undefined) {
    directoryId = directory.id;
  }
  const getPhotoLink = useCallback(
    (photoId: number): Href => {
      return {
        pathname:
          "/(app)/gallery/[galleryId]/directory/[directoryId]/photos/[photoId]",
        params: {
          galleryId,
          directoryId: directoryId ?? 0,
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
    router.replace({
      pathname: "/gallery/[galleryId]/directory/[directoryId]",
      params: {
        galleryId,
        directoryId: directoryId ?? 0,
        order,
      },
    });
  }, [galleryId, directoryId, order, router]);

  const getChildContainerLink = useCallback(
    (containerId: number): Href => {
      return {
        pathname: "/(app)/gallery/[galleryId]/directory/[directoryId]",
        params: {
          galleryId,
          directoryId: containerId,
          order,
        },
      };
    },
    [galleryId, order]
  );

  const getSlideshowLink = useCallback((): Href => {
    return {
      pathname: "/(app)/gallery/[galleryId]/directory/[directoryId]/slideshow",
      params: {
        galleryId,
        directoryId: directoryId ?? 0,
        order,
      },
    };
  }, [galleryId, directoryId, order]);

  const navigateToChildContainer = useCallback(
    (containerId: number) => {
      router.push(getChildContainerLink(containerId));
    },
    [router, getChildContainerLink]
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

    crumbs.push({
      id: 0,
      name: "Tous les albums",
      url: `/gallery/${galleryId}/directory/index`,
    });

    if (directory?.parent?.name) {
      crumbs.push({
        id: directory.parent.id,
        name: directory.parent.name,
        url: `/gallery/${galleryId}/directory/${directory.parent.id}`,
      });
    }

    if (directory && directory.parent) {
      crumbs.push({
        id: directory.id,
        name: directory.name,
        url: `/gallery/${galleryId}/directory/${directory.id}`,
      });
    }
    return crumbs;
  }, [directory, galleryId]);

  const hasParent = directory?.parent != null;

  const containersList =
    directoryId && directory
      ? directoriesStore.subDirectoriesLoader.getValue(directoryId)
      : null;

  const sort = useCallback(
    (by: "date-asc" | "date-desc") => {
      router.replace({
        pathname: "/gallery/[galleryId]/directory/[directoryId]",
        params: { galleryId, directoryId: directoryId ?? 0, order: by },
      });
    },
    [directoryId, galleryId, router]
  );

  const setCover = useCallback(
    async (photoId: number) => {
      if (directoryId)
        await directoriesStore.patchDirectoryAndClearCache(directoryId, {
          coverPhotoId: photoId,
        });
    },
    [directoriesStore, directoryId]
  );

  const setParentCover = useCallback(
    async (directoryId: number) =>
      await directoriesStore.setParentCover(directoryId),
    [directoriesStore]
  );

  const renameContainer = useCallback(
    async (newName: string) => {
      if (!directoryId) return;
      await directoriesStore.renameDirectory(directoryId, newName);
    },
    [directoryId, directoriesStore]
  );

  // Mémoïse la fonction loadPhotos pour pagination offset-based
  const loadPhotos = useCallback<LoadPhotosFunction>(
    async (sortOrder: string, offset: number, count: number) => {
      if (!directoryId) return null;

      // Don't load photos if at root level
      // We consider that these photos are not in any album
      if (directory?.parent == null) return { ok: true, value: [] };
      return await directoriesStore.directoryService.getPhotos(
        directoryId,
        sortOrder,
        offset,
        count
      );
    },
    [directoryId, directory?.parent, directoriesStore.directoryService]
  );

  // Instance unique du store paginé (réinitialisé si le conteneur change)
  const paginatedPhotosStore = useMemo(() => {
    const sortOrder: "asc" | "desc" = order === "date-asc" ? "asc" : "desc";
    return new PaginatedPhotosStore(loadPhotos, sortOrder);
  }, [loadPhotos, order]);

  const directoryStore = useMemo<PhotoContainerStore>(
    () => ({
      navigateToPhoto,
      navigateToContainer,
      navigateToParentContainer,
      hasParent,
      containersList,
      sort,
      order,
      breadCrumbs,
      container: directory,
      navigateToChildContainer,
      getPhotoLink,
      setCover,
      setParentCover,
      renameContainer: directory?.parent ? renameContainer : undefined,
      childContainersHeader: null,
      getChildContainerLink,
      paginatedPhotosStore,
      getSlideshowLink,
    }),
    [
      navigateToPhoto,
      navigateToContainer,
      navigateToParentContainer,
      hasParent,
      containersList,
      sort,
      order,
      breadCrumbs,
      directory,
      navigateToChildContainer,
      getPhotoLink,
      setCover,
      setParentCover,
      renameContainer,
      getChildContainerLink,
      paginatedPhotosStore,
      getSlideshowLink,
    ]
  );

  return (
    <DirectoryStoreContext.Provider value={directoryStore}>
      {children}
    </DirectoryStoreContext.Provider>
  );
});

export function useDirectoryStore() {
  const store = useContext(DirectoryStoreContext);
  if (!store) {
    throw new Error(
      "useDirectoryStore must be used within a DirectoryStoreProvider."
    );
  }
  return store;
}
