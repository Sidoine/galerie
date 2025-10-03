import { Href, useRouter } from "expo-router";
import { observer } from "mobx-react-lite";
import { usePlacesStore } from "./places";
import { useCallback, useMemo } from "react";
import {
  BreadCrumb,
  PhotoContainer,
  PhotoContainerContext,
  PhotoContainerStore,
} from "./photo-container";
import { PlaceType } from "@/services/enums";
import { Photo } from "@/services/views";

const emptyPhotoContainer: PhotoContainer[] = [];
const emptyPhotoList: Photo[] = [];

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
        placeId,
        order,
        year,
        month,
      },
    });
  }, [router, placesStore.galleryId, placeId, order, year, month]);

  const navigateToChildContainer = useCallback(
    (containerId: number) => {
      router.push({
        pathname: "/gallery/[galleryId]/places/[placeId]",
        params: {
          galleryId: placesStore.galleryId,
          placeId:
            place?.type === PlaceType.Country ? containerId : placeId ?? 0,
          order,
          year:
            place?.type !== PlaceType.Country && year === undefined
              ? containerId
              : year,
          month: year !== undefined ? containerId : undefined,
        },
      });
    },
    [router, placesStore.galleryId, place?.type, placeId, order, year]
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
      if (month) {
        crumbs.unshift({
          id: place.id,
          name: month.toString(),
          url: `/gallery/${placesStore.galleryId}/places/${place.id}?order=${order}&year=${year}&month=${month}`,
        });
      } else if (year) {
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
  const photoCount = placeId
    ? placesStore.getPlacePhotoCount(placeId, year, month)
    : null;
  const tooManyPhotos = 10;
  const photoList =
    (photoCount !== null && photoCount < tooManyPhotos) || month !== undefined
      ? placeId
        ? placesStore.getPlacePhotos(placeId, year, month)
        : null
      : emptyPhotoList;
  let containersList: PhotoContainer[] | null = emptyPhotoContainer;
  if (place) {
    if (place.type === PlaceType.Country) {
      containersList = placesStore.getCitiesByCountry(place.id);
    } else {
      if (photoCount === null || photoCount < tooManyPhotos) {
        containersList = emptyPhotoContainer;
      } else {
        if (year && month) {
          containersList = emptyPhotoContainer;
        } else if (year) {
          containersList = placeId
            ? placesStore.getPlaceMonths(placeId, year)
            : null;
        } else {
          containersList = placeId ? placesStore.getPlaceYears(placeId) : null;
        }
      }
    }
  }

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
  const placeStore = useMemo<PhotoContainerStore>(() => {
    return {
      navigateToPhoto,
      navigateToContainer,
      navigateToParentContainer,
      hasParent: !!place?.parentId,
      photoList,
      containersList,
      sort,
      order: order,
      breadCrumbs,
      container: place || null,
      navigateToChildContainer,
      getPhotoLink,
    };
  }, [
    navigateToPhoto,
    navigateToContainer,
    navigateToParentContainer,
    place,
    photoList,
    containersList,
    sort,
    order,
    breadCrumbs,
    navigateToChildContainer,
    getPhotoLink,
  ]);
  if (!placeId) return <>{children}</>;
  return (
    <PhotoContainerContext.Provider value={placeStore}>
      {children}
    </PhotoContainerContext.Provider>
  );
});
