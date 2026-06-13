import {
  View,
  FlatList,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useGlobalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { PhotoCollection } from "@/services/views";
import { useCollectionsListStore } from "@/stores/collections-list";
import Icon from "@/components/Icon";

const CollectionsListScreen = observer(function CollectionsListScreen() {
  const { galleryId } = useGlobalSearchParams<{ galleryId: string }>();
  const router = useRouter();
  const collectionsListStore = useCollectionsListStore();

  useEffect(() => {
    collectionsListStore.loadCollections();
  }, [collectionsListStore]);

  const handleCollectionPress = (collectionId: number) => {
    router.push({
      pathname: `/gallery/[galleryId]/collections/[collectionId]`,
      params: {
        galleryId,
        collectionId,
      },
    });
  };

  const renderCollectionItem = ({ item }: { item: PhotoCollection }) => (
    <Pressable
      style={styles.collectionItem}
      onPress={() => handleCollectionPress(item.id)}
    >
      <View style={styles.collectionHeader}>
        <Text style={styles.collectionName}>{item.name}</Text>
        <Icon set="mci" name="chevron-right" size={24} color="#666" />
      </View>
      <Text style={styles.photoCount}>
        {item.photoCount} {item.photoCount === 1 ? "photo" : "photos"}
      </Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {collectionsListStore.isLoading &&
        !collectionsListStore.collections.length && (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" />
          </View>
        )}

      {!collectionsListStore.isLoading &&
        collectionsListStore.collections.length === 0 &&
        !collectionsListStore.error && (
          <View style={styles.centerContent}>
            <Icon
              set="mci"
              name="folder-heart-outline"
              size={64}
              color="#ccc"
            />
            <Text style={styles.emptyText}>Aucune collection</Text>
            <Text style={styles.emptySubtext}>
              Créez une collection via le menu d'action
            </Text>
          </View>
        )}

      {collectionsListStore.collections.length > 0 && (
        <FlatList
          data={collectionsListStore.collections}
          renderItem={renderCollectionItem}
          keyExtractor={(item) => item.id.toString()}
          refreshing={collectionsListStore.isLoading}
          onRefresh={() => collectionsListStore.loadCollections()}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  listContent: {
    padding: 16,
  },
  collectionItem: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  collectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  photoCount: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
    color: "#333",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
    textAlign: "center",
  },
});

export default CollectionsListScreen;
