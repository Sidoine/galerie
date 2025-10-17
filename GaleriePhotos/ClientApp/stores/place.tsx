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
import { Text } from "react-native";
import { ApiResponse } from "folke-service-helpers";

const emptyPhotoContainer: PhotoContainer[] = [];

const PlaceStoreContext = createContext<PhotoContainerStore | null>(null);

export const PlaceStoreProvider = observer(function PlaceStoreProvider({
  children,
  placeId,
  order = "date-asc",
  year,
  month,
}: {
  children: React.ReactNode;
  placeId: number | undefined;
  order?: "date-asc" | "date-desc";
  year?: number;
  month?: number;
}) {
  const router = useRouter();
  const placesStore = usePlacesStore();
  const place = placeId ? placesStore.getPlace(placeId) : null;
  const containerType: "place" | "year" | "month" =
    month !== undefined ? "month" : year !== undefined ? "year" : "place";
  const container =
    containerType === "place"
      ? place
      : containerType === "year"
      ? placeId && year
        ? placesStore.getPlaceYear(placeId, year)
        : null
      : placeId && year && month
      ? placesStore.getPlaceMonth(placeId, year, month)
      : null;
  const getPhotoLink = useCallback(
    (photoId: number): Href => {
      return {
        pathname: "/gallery/[galleryId]/places/[placeId]/photos/[photoId]",
        params: {
          galleryId: placesStore.galleryId,
          placeId: placeId ?? 0,
          photoId,
          order,
          year,
          month,
        },
      };
    },
    [placesStore.galleryId, placeId, order, year, month]
  );
  const navigateToPhoto = useCallback(
    (photoId: number) => {
      router.push(getPhotoLink(photoId));
    },
    [router, getPhotoLink]
  );
  const navigateToContainer = useCallback(() => {
    router.push({
      pathname: "/gallery/[galleryId]/places/[placeId]",
      params: {
        galleryId: placesStore.galleryId,
        placeId: placeId ?? 0,
        order,
        year,
        month,
      },
    });
  }, [router, placesStore.galleryId, placeId, order, year, month]);

  const photoCount = placeId
    ? placesStore.getPlacePhotoCount(placeId, year, month)
    : 0;
  const tooManyPhotos = 100;

  let childType: "places" | "years" | "months" | "none" = "none";
  let containersList: PhotoContainer[] | null = emptyPhotoContainer;
  if (place) {
    if (place.type === PlaceType.Country) {
      containersList = placesStore.getCitiesByCountry(place.id);
      childType = "places";
    } else {
      if (photoCount === null || photoCount < tooManyPhotos) {
        containersList = emptyPhotoContainer;
      } else {
        if (year && month) {
          containersList = emptyPhotoContainer;
        } else if (year) {
          childType = "months";
          containersList = placeId
            ? placesStore.getPlaceMonths(placeId, year)
            : null;
        } else {
          childType = "years";
          containersList = placeId ? placesStore.getPlaceYears(placeId) : null;
        }
      }
    }
  } else {
    containersList = placesStore.countries;
  }

  const getChildContainerLink = useCallback(
    (containerId: number): Href => {
      const pathname = "/gallery/[galleryId]/places/[placeId]";
      switch (childType) {
        case "none":
          return {
            pathname,
            params: {
              galleryId: placesStore.galleryId,
              placeId: containerId ?? 0,
            },
          };
        case "places":
          return {
            pathname,
            params: {
              galleryId: placesStore.galleryId,
              placeId: containerId ?? 0,
            },
          };
        case "years":
          return {
            pathname,
            params: {
              galleryId: placesStore.galleryId,
              placeId: placeId ?? 0,
              year: containerId,
            },
          };
        case "months":
          return {
            pathname,
            params: {
              galleryId: placesStore.galleryId,
              placeId: placeId ?? 0,
              year: year,
              month: containerId,
            },
          };
      }
    },
    [childType, placesStore.galleryId, placeId, year]
  );

  const navigateToChildContainer = useCallback(
    (containerId: number) => {
      router.push(getChildContainerLink(containerId));
    },
    [router, getChildContainerLink]
  );

  const navigateToParentContainer = useCallback(() => {
    if (month) {
      router.push({
        pathname: "/gallery/[galleryId]/places/[placeId]",
        params: {
          galleryId: placesStore.galleryId,
          placeId: placeId ?? 0,
          order,
          year,
          month: undefined,
        },
      });
    } else if (year) {
      router.push({
        pathname: "/gallery/[galleryId]/places/[placeId]",
        params: {
          galleryId: placesStore.galleryId,
          placeId: placeId ?? 0,
          order,
          year: undefined,
          month: undefined,
        },
      });
    } else if (place?.parentId) {
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
  }, [
    month,
    order,
    place?.parentId,
    placeId,
    placesStore.galleryId,
    router,
    year,
  ]);

  const parentPlace = place?.parentId
    ? placesStore.getPlace(place.parentId)
    : null;

  const breadCrumbs = useMemo<BreadCrumb[]>(() => {
    const crumbs: BreadCrumb[] = [];
    if (place) {
      if (month && year) {
        crumbs.unshift({
          id: place.id,
          name: new Date(year, month - 1, 1).toLocaleString("default", {
            month: "long",
          }),
          url: `/gallery/${placesStore.galleryId}/places/${place.id}?order=${order}&year=${year}&month=${month}`,
        });
      }
      if (year) {
        crumbs.unshift({
          id: place.id,
          name: year.toString(),
          url: `/gallery/${placesStore.galleryId}/places/${place.id}?order=${order}&year=${year}`,
        });
      }

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
  }, [month, order, parentPlace, place, placesStore.galleryId, year]);

  const sort = useCallback(
    (order: "date-asc" | "date-desc") => {
      router.replace({
        pathname: "/gallery/[galleryId]/places/[placeId]",
        params: {
          galleryId: placesStore.galleryId,
          placeId: placeId ?? 0,
          order: order,
          year,
          month,
        },
      });
    },
    [month, placeId, placesStore.galleryId, router, year]
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
      ) : (
        <Text>Années</Text>
      ),
    [containersList, navigateToChildContainer, place]
  );

  const loadPhotos = useCallback(
    async (
      sortOrder: string,
      offset: number,
      count: number
    ): Promise<PhotoResponse<Photo[]>> => {
      if (!placeId) return { ok: true, value: [] };
      return await placesStore.placeController.getPlacePhotos(
        placeId,
        year,
        month,
        sortOrder,
        offset,
        count
      );
    },
    [placeId, placesStore, year, month]
  );

  const paginatedPhotosStore = useMemo(() => {
    const sortOrder: "asc" | "desc" = order === "date-asc" ? "asc" : "desc";
    return new PaginatedPhotosStore(container, loadPhotos, sortOrder);
  }, [container, loadPhotos, order]);

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
