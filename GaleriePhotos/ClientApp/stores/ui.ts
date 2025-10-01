import { useCallback } from "react";
import { useDirectoriesStore } from "./directories";
import { useLocalSearchParams, useRouter } from "expo-router";

export type OrderType = "date-desc" | "date-asc";

export function createDirectoryUrl(
  galleryId: number,
  directoryId: number,
  order: OrderType
) {
  // React Navigation uses objects for navigation params instead of URLs
  return {
    screen: "Directory",
    params: { galleryId, directoryId, order },
  };
}

export function createPhotoUrl(
  galleryId: number,
  directoryId: number,
  photoId: number,
  order: "date-desc" | "date-asc"
) {
  return {
    screen: "Photo",
    params: { galleryId, directoryId, photoId, order },
  };
}

export function useUi() {
  const directoriesStore = useDirectoriesStore();
  const navigation = useRouter();
  const params = useLocalSearchParams<{ order?: OrderType }>();
  const order: OrderType =
    params.order === "date-desc" ? "date-desc" : "date-asc";

  const navigateToDirectory = useCallback(
    (directoryId: number, newOrder?: "date-desc" | "date-asc") => {
      navigation.replace({
        pathname: "/(app)/gallery/[galleryId]/directory/[directoryId]",
        params: {
          galleryId: directoriesStore.galleryId,
          directoryId,
          order: newOrder ?? order,
        },
      });
    },
    [directoriesStore.galleryId, navigation, order]
  );

  const navigateToPhoto = useCallback(
    (directoryId: number, photoId: number) => {
      navigation.navigate({
        pathname: "/(app)/gallery/[galleryId]/photos/[photoId]",
        params: {
          galleryId: directoriesStore.galleryId,
          directoryId,
          photoId,
          order,
        },
      });
    },
    [directoriesStore.galleryId, navigation, order]
  );

  return {
    order,
    navigateToDirectory,
    navigateToPhoto,
  } as const;
}
