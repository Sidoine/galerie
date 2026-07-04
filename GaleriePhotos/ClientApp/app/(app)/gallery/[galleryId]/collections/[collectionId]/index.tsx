import React from "react";
import { useEffect, useLayoutEffect, useMemo } from "react";
import { useGlobalSearchParams } from "expo-router";
import { useNavigation } from "expo-router";
import { DirectoryView } from "@/components/container-view/directory-view";
import BreadCrumbs from "@/components/bread-crumbs";
import HeaderMenu from "@/components/header-menu";
import { useCollectionsListStore } from "@/stores/collections-list";
import {
  CollectionsStoreProvider,
  useCollectionsStore,
} from "@/stores/collections";

function CollectionDetailContent() {
  const store = useCollectionsStore();
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: () => <BreadCrumbs store={store.containerStore} />,
      headerRight: () => <HeaderMenu store={store.containerStore} />,
    });
  }, [navigation, store.containerStore]);

  return <DirectoryView store={store.containerStore} />;
}

export default function CollectionDetailPage() {
  const { galleryId, collectionId } = useGlobalSearchParams<{
    galleryId: string;
    collectionId: string;
  }>();
  const collectionsListStore = useCollectionsListStore();

  useEffect(() => {
    if (
      collectionsListStore.collections.length === 0 &&
      !collectionsListStore.isLoading
    ) {
      void collectionsListStore.loadCollections();
    }
  }, [collectionsListStore]);

  const resolvedCollectionName = useMemo(() => {
    if (!collectionId) {
      return "Collection";
    }

    return (
      collectionsListStore.collections.find(
        (collection) => collection.id === Number(collectionId),
      )?.name ?? "Collection"
    );
  }, [collectionId, collectionsListStore.collections]);

  if (!galleryId || !collectionId) {
    return null;
  }

  return (
    <CollectionsStoreProvider
      galleryId={Number(galleryId)}
      collectionId={Number(collectionId)}
      collectionName={resolvedCollectionName}
    >
      <CollectionDetailContent />
    </CollectionsStoreProvider>
  );
}
