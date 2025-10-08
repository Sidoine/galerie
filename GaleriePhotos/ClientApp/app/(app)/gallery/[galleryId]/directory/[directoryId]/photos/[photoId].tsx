import ImageView from "@/components/image-view";
import { useDirectoryStore } from "@/stores/directory";

export default function DirectoryPhotoScreen() {
  return <ImageView store={useDirectoryStore()} />;
}
