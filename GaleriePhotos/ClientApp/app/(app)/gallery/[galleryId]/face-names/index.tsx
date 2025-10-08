import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { observer } from "mobx-react-lite";
import { FaceName } from "../../../../../services/views";
import { useDirectoriesStore } from "@/stores/directories";
import { useRouter } from "expo-router";
import { useFaceNamesStore } from "@/stores/face-names";

const FaceNamesScreen = observer(function FaceNames() {
  const { galleryId } = useDirectoriesStore();
  const faceNamesStore = useFaceNamesStore();
  const router = useRouter();

  if (faceNamesStore.names === null) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  const names = faceNamesStore.names;

  if (!names || names.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Aucun nom de visage trouvé</Text>
      </View>
    );
  }

  const renderFaceName = ({ item }: { item: FaceName }) => (
    <TouchableOpacity
      style={styles.faceNameItem}
      onPress={() =>
        router.navigate({
          pathname: "/(app)/gallery/[galleryId]/face-names/[faceNameId]",
          params: {
            faceNameId: item.id,
            galleryId,
          },
        })
      }
    >
      <Image
        source={{ uri: faceNamesStore.getFaceNameThumbnailUrl(item.id) }}
        style={styles.faceImage}
      />
      <Text style={styles.faceNameText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={names}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFaceName}
        numColumns={3}
        contentContainerStyle={styles.gridContainer}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  gridContainer: {
    paddingBottom: 20,
  },
  faceNameItem: {
    flex: 1,
    alignItems: "center",
    margin: 8,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    maxWidth: "30%",
  },
  faceImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
    backgroundColor: "#e0e0e0",
  },
  faceNameText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    color: "#333",
  },
  photoCount: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#d32f2f",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});

export default FaceNamesScreen;
