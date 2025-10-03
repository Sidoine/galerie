import { useDirectoriesStore } from "@/stores/directories";
import { Redirect } from "expo-router";

function Back() {
  const { galleryId } = useDirectoriesStore();
  return <Redirect href={`/gallery/${galleryId}`} />;
}

export default Back;
