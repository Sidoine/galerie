import { DiaporamaScreen } from "@/components/diaporama-screen";
import { usePlaceStore } from "@/stores/place";

export default function PlaceSlideshow() {
  const store = usePlaceStore();
  return <DiaporamaScreen store={store} />;
}
