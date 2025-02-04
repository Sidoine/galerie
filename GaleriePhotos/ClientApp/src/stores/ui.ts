import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function createDirectoryUrl(
    directoryId: number,
    order: "date-desc" | "date-asc"
) {
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.set("order", order);
    return `/directory/${directoryId}?${urlSearchParams}`;
}

export function createPhotoUrl(
    directoryId: number,
    photoId: number,
    order: "date-desc" | "date-asc"
) {
    const urlSearchParams = new URLSearchParams();
    urlSearchParams.set("order", order);
    return `/directory/${directoryId}/images/${photoId}?${urlSearchParams}`;
}

export function useUi() {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const navigate = useNavigate();
    const order =
        params.get("order") === "date-desc" ? "date-desc" : "date-asc";
    const navigateToDirectory = useCallback(
        (directoryId: number, newOrder?: "date-desc" | "date-asc") =>
            navigate(createDirectoryUrl(directoryId, newOrder ?? order)),
        []
    );
    const navigateToPhoto = useCallback(
        (directoryId: number, photoId: number) =>
            navigate(createPhotoUrl(directoryId, photoId, order)),
        []
    );
    return {
        order,
        navigateToDirectory,
        navigateToPhoto,
    } as const;
}
