import { DiaporamaScreen } from "@/components/diaporama-screen";
import { useFaceNameStore } from "@/stores/face-name";

export default function FaceNameSlideshow() {
  const store = useFaceNameStore();

  return <DiaporamaScreen store={store} />;
}
