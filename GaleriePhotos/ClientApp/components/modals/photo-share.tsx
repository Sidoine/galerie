import { useCallback, useState, useEffect } from "react";
import * as Sharing from "expo-sharing";
import { usePhotosStore } from "@/stores/photos";
import { Photo } from "@/services/views";
import { Directory, File, Paths } from "expo-file-system";

export function useShare() {
  const [canShare, setCanShare] = useState(false);
  const photosStore = usePhotosStore();

  useEffect(() => {
    async function checkSharingAvailability() {
      const available = await Sharing.isAvailableAsync();
      setCanShare(available);
    }
    checkSharingAvailability();
  }, []);

  const share = useCallback(
    async (photo: Photo) => {
      if (!canShare) return;

      // Construction de l'URL distante de l'image (originale) via store
      const imageUrl = photosStore.getImage(photo.publicId);

      // Télécharger l'image dans un fichier temporaire (obligatoire pour expo-sharing sur mobile)
      const fileName = `shared-${photo.publicId}.jpg`;
      const baseDir = Paths.cache;
      const tmpPath = `${baseDir}${fileName}`;
      const download = await File.downloadFileAsync(
        imageUrl,
        new Directory(tmpPath)
      );
      await Sharing.shareAsync(download.uri, {
        dialogTitle: "Partager l'image",
        mimeType: download.type,
      });
    },
    [canShare, photosStore]
  );
  return [share, canShare] as const;
}
