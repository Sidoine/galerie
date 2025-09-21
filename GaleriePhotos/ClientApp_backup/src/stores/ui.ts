import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDirectoriesStore } from "./directories";

export function createDirectoryUrl(
    galleryId: number,
    directoryId: number,
    order: "date-desc" | "date-asc"
) {
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.set("order", order);
    return `/g/${galleryId}/directory/${directoryId}?${urlSearchParams}`;
}

export function createPhotoUrl(
    galleryId: number,
    directoryId: number,
    photoId: number,
    order: "date-desc" | "date-asc"
) {
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.set("order", order);
    return `/g/${galleryId}/directory/${directoryId}/images/${photoId}?${urlSearchParams}`;
}

export function useUi() {
    const directoriesStore = useDirectoriesStore();
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const navigate = useNavigate();
    const order =
        params.get("order") === "date-desc" ? "date-desc" : "date-asc";
    const navigateToDirectory = useCallback(
        (directoryId: number, newOrder?: "date-desc" | "date-asc") =>
            navigate(
                createDirectoryUrl(
                    directoriesStore.galleryId,
                    directoryId,
                    newOrder ?? order
                )
            ),
        [directoriesStore.galleryId, navigate, order]
    );
    const navigateToPhoto = useCallback(
        (directoryId: number, photoId: number) =>
            navigate(
                createPhotoUrl(
                    directoriesStore.galleryId,
                    directoryId,
                    photoId,
                    order
                )
            ),
        [directoriesStore.galleryId, navigate, order]
    );
    return {
        order,
        navigateToDirectory,
        navigateToPhoto,
    } as const;
}
