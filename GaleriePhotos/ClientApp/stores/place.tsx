import { Href, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { usePlacesStore } from "./places";
import { createContext, useCallback, useContext, useMemo } from "react";
import { PaginatedPhotosStore, PhotoResponse } from "./paginated-photos";
import {
  BreadCrumb,
  PhotoContainer,
  PhotoContainerStore,
} from "./photo-container";
import { PlaceType } from "@/services/enums";
import { Photo, Place } from "@/services/views";
import PlacesMap from "@/components/places-map";

const emptyPhotoContainer: PhotoContainer[] = [];

const PlaceStoreContext = createContext<PhotoContainerStore | null>(null);

export const PlaceStoreProvider = observer(function PlaceStoreProvider({
  children,
  placeId,
  order = "date-asc",
}: {
  children: React.ReactNode;
  placeId: number | undefined;
  order?: "date-asc" | "date-desc";
}) {
  const router = useRouter();
  const placesStore = usePlacesStore();
  const place = placeId ? placesStore.getPlace(placeId) : null;
  const container = place;
  
  const getPhotoLink = useCallback(
    (photoId: number): Href => {
      return {
        pathname: "/gallery/[galleryId]/places/[placeId]/photos/[photoId]",
        params: {
          galleryId: placesStore.galleryId,
          placeId: placeId ?? 0,
          photoId,
          order,
        },
      };
    },
    [placesStore.galleryId, placeId, order]
  );
  
  const navigateToPhoto = useCallback(
    (photoId: number) => {
      router.push(getPhotoLink(photoId));
    },
    [router, getPhotoLink]
  );
  
  const navigateToContainer = useCallback(() => {
    router.replace({
      pathname: "/gallery/[galleryId]/places/[placeId]",
      params: {
        galleryId: placesStore.galleryId,
        placeId: placeId ?? 0,
        order,
      },
    });
  }, [router, placesStore.galleryId, placeId, order]);

  let childType: "places" | "none" = "none";
  let containersList: PhotoContainer[] | null = emptyPhotoContainer;
  if (place) {
    if (place.type === PlaceType.Country) {
      containersList = placesStore.getCitiesByCountry(place.id);
      childType = "places";
    } else {
      containersList = emptyPhotoContainer;
    }
  } else {
    containersList = placesStore.countries;
  }

  const getChildContainerLink = useCallback(
    (containerId: number): Href => {
      const pathname = "/gallery/[galleryId]/places/[placeId]";
      return {
        pathname,
        params: {
          galleryId: placesStore.galleryId,
          placeId: containerId ?? 0,
        },
      };
    },
    [placesStore.galleryId]
  );

  const getSlideshowLink = useCallback((): Href => {
    return {
      pathname: "/(app)/gallery/[galleryId]/places/[placeId]/slideshow",
      params: {
        galleryId: placesStore.galleryId,
        placeId: placeId ?? 0,
        order,
      },
    };
  }, [placesStore.galleryId, placeId, order]);

  const navigateToChildContainer = useCallback(
    (containerId: number) => {
      router.push(getChildContainerLink(containerId));
    },
    [router, getChildContainerLink]
  );

  const navigateToParentContainer = useCallback(() => {
    if (place?.parentId) {
      router.push({
        pathname: "/gallery/[galleryId]/places/[placeId]",
        params: {
          galleryId: placesStore.galleryId,
          placeId: place.parentId,
          order,
        },
      });
    } else {
      router.push(`/gallery/${placesStore.galleryId}/places`);
    }
  }, [order, place?.parentId, placeId, placesStore.galleryId, router]);

  const parentPlace = place?.parentId
    ? placesStore.getPlace(place.parentId)
    : null;

  const breadCrumbs = useMemo<BreadCrumb[]>(() => {
    const crumbs: BreadCrumb[] = [];
    if (place) {
      crumbs.unshift({
        id: place.id,
        name: place.name,
        url: `/gallery/${placesStore.galleryId}/places/${place.id}`,
      });
    }

    if (parentPlace) {
      crumbs.unshift({
        id: parentPlace.id,
        name: parentPlace.name,
        url: `/gallery/${placesStore.galleryId}/places/${parentPlace.id}`,
      });
    }

    crumbs.unshift({
      id: 0,
      name: "Lieux",
      url: `/gallery/${placesStore.galleryId}/places`,
    });

    return crumbs;
  }, [parentPlace, place, placesStore.galleryId]);

  const sort = useCallback(
    (order: "date-asc" | "date-desc") => {
      router.replace({
        pathname: "/gallery/[galleryId]/places/[placeId]",
        params: {
          galleryId: placesStore.galleryId,
          placeId: placeId ?? 0,
          order: order,
        },
      });
    },
    [placeId, placesStore.galleryId, router]
  );

  const setCover = useCallback(
    async (photoId: number) => {
      if (placeId) await placesStore.setCover(placeId, photoId);
    },
    [placeId, placesStore]
  );

  const childContainersHeader = useMemo(
    () =>
      place === null || place.type === PlaceType.Country ? (
        <PlacesMap
          onClickPhotos={navigateToChildContainer}
          onClickPlace={navigateToChildContainer}
          placesToShow={(containersList as Place[]) || emptyPhotoContainer}
          selectedCountry={place}
        />
      ) : null,
    [containersList, navigateToChildContainer, place]
  );

  const loadPhotos = useCallback(
    async (
      sortOrder: string,
      offset: number,
      count: number,
      startDate?: string | null
    ): Promise<PhotoResponse<Photo[]>> => {
      if (!placeId) return { ok: true, value: [] };
      return await placesStore.placeController.getPlacePhotos(
        placeId,
        sortOrder,
        offset,
        count,
        startDate
      );
    },
    [placeId, placesStore]
  );

  const paginatedPhotosStore = useMemo(() => {
    const sortOrder: "asc" | "desc" = order === "date-asc" ? "asc" : "desc";
    return new PaginatedPhotosStore(loadPhotos, sortOrder);
  }, [loadPhotos, order]);

  const placeStore = useMemo<PhotoContainerStore>(() => {
    return {
      navigateToPhoto,
      navigateToContainer,
      navigateToParentContainer,
      hasParent: !!place?.parentId,
      containersList,
      sort,
      order: order,
      breadCrumbs,
      container: container,
      navigateToChildContainer,
      getPhotoLink,
      setCover,
      childContainersHeader,
      getChildContainerLink,
      paginatedPhotosStore,
      getSlideshowLink,
    };
  }, [
    navigateToPhoto,
    navigateToContainer,
    navigateToParentContainer,
    place?.parentId,
    containersList,
    sort,
    order,
    breadCrumbs,
    container,
    navigateToChildContainer,
    getPhotoLink,
    setCover,
    childContainersHeader,
    getChildContainerLink,
    paginatedPhotosStore,
    getSlideshowLink,
  ]);
  return (
    <PlaceStoreContext.Provider value={placeStore}>
      {children}
    </PlaceStoreContext.Provider>
  );
});

export function usePlaceStore() {
  const store = useContext(PlaceStoreContext);
  if (!store) {
    throw new Error("usePlaceStore must be used within a PlaceStoreProvider.");
  }
  return store;
}
