import ImageView from "@/components/image-view";
import { useFaceNameStore } from "@/stores/face-name";

export default function FaceNamePhotoScreen() {
  return <ImageView store={useFaceNameStore()} />;
}
