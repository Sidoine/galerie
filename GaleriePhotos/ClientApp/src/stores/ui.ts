import { useCallback } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { GalleryStackParamList, OrderType } from "../navigation-types";
import { StackNavigationProp } from "@react-navigation/stack";
import { useDirectoriesStore } from "./directories";

export function createDirectoryUrl(
  galleryId: number,
  directoryId: number,
  order: "date-desc" | "date-asc"
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
  const navigation =
    useNavigation<StackNavigationProp<GalleryStackParamList>>();
  // TODO
  const route = useRoute();
  const params = (route.params as any) || {};
  const order: OrderType =
    params.order === "date-desc" ? "date-desc" : "date-asc";

  const navigateToDirectory = useCallback(
    (directoryId: number, newOrder?: "date-desc" | "date-asc") => {
      navigation.navigate("Directory", {
        galleryId: directoriesStore.galleryId,
        directoryId,
        order: newOrder ?? order,
      });
    },
    [directoriesStore.galleryId, navigation, order]
  );

  const navigateToPhoto = useCallback(
    (directoryId: number, photoId: number) => {
      navigation.navigate("Photo", {
        galleryId: directoriesStore.galleryId,
        directoryId,
        photoId,
        order,
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
