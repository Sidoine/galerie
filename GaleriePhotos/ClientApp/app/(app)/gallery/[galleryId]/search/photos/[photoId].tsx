import ImageView from "@/components/image-view";
import { useSearchStore } from "@/stores/search";

export default function SearchPhotoScreen() {
  return <ImageView store={useSearchStore()} />;
}
