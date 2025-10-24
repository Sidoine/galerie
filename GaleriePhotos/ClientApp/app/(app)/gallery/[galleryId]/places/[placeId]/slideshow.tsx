import { DiaporamaScreen } from "@/components/diaporama-screen";
import { usePlaceStore } from "@/stores/place";
import { useRouter } from "expo-router";
import { useCallback } from "react";

export default function PlaceSlideshow() {
  const store = usePlaceStore();
  const router = useRouter();

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return <DiaporamaScreen store={store} onClose={handleClose} />;
}
