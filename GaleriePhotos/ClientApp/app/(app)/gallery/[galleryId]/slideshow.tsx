import { DiaporamaScreen } from "@/components/diaporama-screen";
import { useGalleryStore } from "@/stores/gallery";

export default function GallerySlideshow() {
  const store = useGalleryStore();

  return <DiaporamaScreen store={store} />;
}
