import { DiaporamaScreen } from "@/components/diaporama-screen";
import { useSearchStore } from "@/stores/search";
import { useRouter } from "expo-router";
import { useCallback } from "react";

export default function SearchSlideshow() {
  const store = useSearchStore();
  const router = useRouter();

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return <DiaporamaScreen store={store} onClose={handleClose} />;
}
