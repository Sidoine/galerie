import React from "react";
import { useGlobalSearchParams } from "expo-router";
import { DiaporamaScreen } from "@/components/diaporama-screen";
import {
  CollectionsStoreProvider,
  useCollectionsStore,
} from "@/stores/collections";

function CollectionSlideshowContent() {
  const store = useCollectionsStore();
  return <DiaporamaScreen store={store.containerStore} />;
}

export default function CollectionSlideshow() {
  const { galleryId, collectionId } = useGlobalSearchParams<{
    galleryId: string;
    collectionId: string;
  }>();

  if (!galleryId || !collectionId) {
    return null;
  }

  return (
    <CollectionsStoreProvider
      galleryId={Number(galleryId)}
      collectionId={Number(collectionId)}
    >
      <CollectionSlideshowContent />
    </CollectionsStoreProvider>
  );
}
