import { useCallback } from "react";
import { usePhotosStore } from "@/stores/photos";
import { Photo } from "@/services/views";

export function useShare() {
  const canShare = window.navigator.share !== undefined;
  const photosStore = usePhotosStore();

  const share = useCallback(
    async (photo: Photo) => {
      if (!window.navigator.canShare) return;

      // Construction de l'URL distante de l'image (originale) via store
      const imageUrl = photosStore.getImage(photo.publicId);

      const result = await fetch(imageUrl);
      if (result.ok) {
        const blob = await result.blob();
        const file = new File([blob], `shared-${photo.publicId}.jpg`, {
          type: blob.type,
        });
        if (window.navigator.canShare({ files: [file] })) {
          await window.navigator.share({
            title: "Partager l'image",
            files: [file],
          });
        } else if (window.navigator.canShare({ url: imageUrl })) {
          await window.navigator.share({
            title: "Partager l'image",
            url: imageUrl,
          });
        }
      }
    },
    [photosStore]
  );
  return [share, canShare] as const;
}
