import { DiaporamaScreen } from "@/components/diaporama-screen";
import { useSearchStore } from "@/stores/search";

export default function SearchSlideshow() {
  const store = useSearchStore();

  return <DiaporamaScreen store={store} />;
}
