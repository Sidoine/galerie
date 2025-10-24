import { DiaporamaScreen } from "@/components/diaporama-screen";
import { useDirectoryStore } from "@/stores/directory";

export default function DirectorySlideshow() {
  const store = useDirectoryStore();

  return <DiaporamaScreen store={store} />;
}
