import { DiaporamaScreen } from "@/components/diaporama-screen";
import { useGalleryStore } from "@/stores/gallery";
import { useRouter } from "expo-router";
import { useCallback } from "react";

export default function GallerySlideshow() {
  const store = useGalleryStore();
  const router = useRouter();

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return <DiaporamaScreen store={store} onClose={handleClose} />;
}
