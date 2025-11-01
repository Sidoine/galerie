import React from "react";
import { DirectoryView } from "@/components/container-view/directory-view";
import { useFavoritesStore } from "@/stores/favorites";

export default function GalleryFavoritesPage() {
  const store = useFavoritesStore();
  return <DirectoryView store={store} />;
}
