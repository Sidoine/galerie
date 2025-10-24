import { DiaporamaScreen } from "@/components/diaporama-screen";
import { useDirectoryStore } from "@/stores/directory";
import { useRouter } from "expo-router";
import { useCallback } from "react";

export default function DirectorySlideshow() {
  const store = useDirectoryStore();
  const router = useRouter();

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return <DiaporamaScreen store={store} onClose={handleClose} />;
}
