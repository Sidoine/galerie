import { DiaporamaScreen } from "@/components/diaporama-screen";
import { useFaceNameStore } from "@/stores/face-name";
import { useRouter } from "expo-router";
import { useCallback } from "react";

export default function FaceNameSlideshow() {
  const store = useFaceNameStore();
  const router = useRouter();

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return <DiaporamaScreen store={store} onClose={handleClose} />;
}
