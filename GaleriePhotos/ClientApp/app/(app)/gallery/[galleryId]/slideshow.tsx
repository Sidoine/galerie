import { DiaporamaScreen } from "@/components/diaporama-screen";
import { useGalleryStore } from "@/stores/gallery";
import { useRouter } from "expo-router";
import { useCallback } from "react";

export default function GallerySlideshow() {
  const store = useGalleryStore();

  return <DiaporamaScreen store={store} />;
}
