import { useCallback } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useDirectoriesStore } from "./directories";

export function createDirectoryUrl(
    galleryId: number,
    directoryId: number,
    order: "date-desc" | "date-asc"
) {
    // React Navigation uses objects for navigation params instead of URLs
    return {
        screen: 'Directory',
        params: { galleryId, directoryId, order }
    };
}

export function createPhotoUrl(
    galleryId: number,
    directoryId: number,
    photoId: number,
    order: "date-desc" | "date-asc"
) {
    return {
        screen: 'Photo',
        params: { galleryId, directoryId, photoId, order }
    };
}

export function useUi() {
    const directoriesStore = useDirectoriesStore();
    const navigation = useNavigation();
    const route = useRoute();
    const params = route.params as any || {};
    const order = params.order === "date-desc" ? "date-desc" : "date-asc";
    
    const navigateToDirectory = useCallback(
        (directoryId: number, newOrder?: "date-desc" | "date-asc") =>
            navigation.navigate('Directory' as never, {
                galleryId: directoriesStore.galleryId,
                directoryId,
                order: newOrder ?? order
            } as never),
        [directoriesStore.galleryId, navigation, order]
    );
    
    const navigateToPhoto = useCallback(
        (directoryId: number, photoId: number) =>
            navigation.navigate('Photo' as never, {
                galleryId: directoriesStore.galleryId,
                directoryId,
                photoId,
                order
            } as never),
        [directoriesStore.galleryId, navigation, order]
    );
    
    return {
        order,
        navigateToDirectory,
        navigateToPhoto,
    } as const;
}
