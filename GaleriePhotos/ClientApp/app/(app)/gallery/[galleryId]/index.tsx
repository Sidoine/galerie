import React from "react";
import { observer } from "mobx-react-lite";
import { DirectoryView } from "@/components/directory-view";
import { useGalleryStore } from "@/stores/gallery";

const GalleryPage = observer(function GalleryPage() {
  const galleryStore = useGalleryStore();
  return <DirectoryView store={galleryStore} />;
});

export default GalleryPage;
