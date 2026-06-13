import React from "react";
import { useGlobalSearchParams } from "expo-router";
import ImageView from "@/components/image-view";
import {
  CollectionsStoreProvider,
  useCollectionsStore,
} from "@/stores/collections";

function CollectionPhotoContent() {
  const store = useCollectionsStore();
  return <ImageView store={store.containerStore} />;
}

export default function CollectionPhotoScreen() {
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
      <CollectionPhotoContent />
    </CollectionsStoreProvider>
  );
}
