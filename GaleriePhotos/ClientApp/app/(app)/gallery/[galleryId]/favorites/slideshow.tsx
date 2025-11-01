import { DiaporamaScreen } from "@/components/diaporama-screen";
import { useFavoritesStore } from "@/stores/favorites";

export default function FavoritesSlideshow() {
  const store = useFavoritesStore();

  return <DiaporamaScreen store={store} />;
}
