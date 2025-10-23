import { DirectoryView } from "@/components/container-view/directory-view";
import { usePlaceStore } from "@/stores/place";

export default function PlacesMapScreen() {
  const placeStore = usePlaceStore();
  return <DirectoryView store={placeStore} />;
}
