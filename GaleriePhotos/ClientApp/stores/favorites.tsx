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
import { FavoriteController } from "@/services/favorite";

const FavoritesStoreContext = createContext<PhotoContainerStore | null>(null);

const FAVORITES_CONTAINER_ID = -1;

export const FavoritesStoreProvider = observer(function FavoritesStoreProvider({
  children,
  galleryId,
  order = "date-desc",
}: {
  children: React.ReactNode;
  galleryId: number;
  order?: "date-asc" | "date-desc";
}) {
  const router = useRouter();
  const apiClient = useApiClient();

  const getPhotoLink = useCallback(
    (photoId: number): Href => ({
      pathname: "/gallery/[galleryId]/favorites/photos/[photoId]",
      params: { order, galleryId, photoId },
    }),
    [galleryId, order]
  );

  const navigateToPhoto = useCallback(
    (photoId: number) => router.push(getPhotoLink(photoId)),
    [router, getPhotoLink]
  );

  const navigateToContainer = useCallback(() => {
    router.replace({
      pathname: `/gallery/[galleryId]/favorites`,
      params: { order, galleryId },
    });
  }, [router, galleryId, order]);

  const navigateToParentContainer = useCallback(() => {
    router.back();
  }, [router]);

  const navigateToChildContainer = useCallback((containerId: number) => {
    void containerId; // Favorites don't expose child containers
  }, []);

  const getChildContainerLink = useCallback(
    (): Href => ({
      pathname: `/gallery/[galleryId]/favorites`,
      params: { order, galleryId },
    }),
    [galleryId, order]
  );

  const getSlideshowLink = useCallback(
    (): Href => ({
      pathname: `/gallery/[galleryId]/favorites/slideshow`,
      params: { order, galleryId },
    }),
    [galleryId, order]
  );

  const breadCrumbs = useMemo<BreadCrumb[]>(
    () => [
      {
        id: FAVORITES_CONTAINER_ID,
        name: "Favoris",
        url: {
          pathname: `/gallery/[galleryId]/favorites`,
          params: { order, galleryId },
        },
      },
    ],
    [galleryId, order]
  );

  const favoriteController = useMemo(
    () => new FavoriteController(apiClient),
    [apiClient]
  );

  const loadPhotos = useCallback<LoadPhotosFunction>(
    (
      sortOrder: string,
      offset: number,
      count: number,
      startDate?: string | null
    ) =>
      favoriteController.getFavoritePhotos(
        galleryId,
        sortOrder,
        offset,
        count,
        startDate
      ),
    [favoriteController, galleryId]
  );

  const paginatedPhotosStore = useMemo(() => {
    const sortOrderValue: "asc" | "desc" =
      order === "date-asc" ? "asc" : "desc";
    return new PaginatedPhotosStore(loadPhotos, sortOrderValue);
  }, [loadPhotos, order]);

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
      id: FAVORITES_CONTAINER_ID,
      name: "Favoris",
      numberOfPhotos: paginatedPhotosStore.photos.length,
      minDate,
      maxDate,
      coverPhotoId: null,
      dateJumps: [],
    };
  }, [paginatedPhotosStore.photos]);

  const sort = useCallback(
    (order: "date-asc" | "date-desc") => {
      router.replace({
        pathname: `/gallery/[galleryId]/favorites`,
        params: { galleryId, order },
      });
    },
    [galleryId, router]
  );

  const favoritesStore = useMemo<PhotoContainerStore>(
    () => ({
      navigateToPhoto,
      navigateToContainer,
      navigateToParentContainer,
      navigateToChildContainer,
      hasParent: false,
      containersList: null,
      sort,
      order,
      breadCrumbs,
      container,
      getPhotoLink,
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
      getChildContainerLink,
      paginatedPhotosStore,
      getSlideshowLink,
    ]
  );

  return (
    <FavoritesStoreContext.Provider value={favoritesStore}>
      {children}
    </FavoritesStoreContext.Provider>
  );
});

export function useFavoritesStore() {
  const store = useContext(FavoritesStoreContext);
  if (!store) {
    throw new Error(
      "useFavoritesStore must be used within a FavoritesStoreProvider."
    );
  }
  return store;
}
