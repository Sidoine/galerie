import ImageView from "@/components/image-view";
import { useFavoritesStore } from "@/stores/favorites";

export default function FavoritesPhotoScreen() {
  return <ImageView store={useFavoritesStore()} />;
}
