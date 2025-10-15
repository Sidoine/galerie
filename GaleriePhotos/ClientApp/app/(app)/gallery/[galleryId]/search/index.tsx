import React from "react";
import { DirectoryView } from "@/components/directory-view";
import { useSearchStore } from "@/stores/search";
import { GallerySearchBar } from "@/components/gallery-search-bar";

export default function GallerySearchPage() {
  const store = useSearchStore();
  return (
    <>
      <GallerySearchBar />
      <DirectoryView store={store} />
    </>
  );
}
