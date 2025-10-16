import React from "react";
import { observer } from "mobx-react-lite";
import { DirectoryView } from "@/components/directory-view";
import { GallerySearchBar } from "@/components/gallery-search-bar";
import { useGalleryStore } from "@/stores/gallery";

const GalleryPage = observer(function GalleryPage() {
  const galleryStore = useGalleryStore();

  return (
    <>
      <GallerySearchBar />
      <DirectoryView store={galleryStore} />
    </>
  );
});

export default GalleryPage;
