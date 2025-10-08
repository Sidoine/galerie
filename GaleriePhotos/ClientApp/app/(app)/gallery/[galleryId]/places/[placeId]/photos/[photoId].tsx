import ImageView from "@/components/image-view";
import { usePlaceStore } from "@/stores/place";

export default function PlacePhotoScreen() {
  return <ImageView store={usePlaceStore()} />;
}
