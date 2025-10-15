import ImageView from "@/components/image-view";
import { useGalleryStore } from "@/stores/gallery";

export default function GalleryPhotoScreen() {
  return <ImageView store={useGalleryStore()} />;
}
