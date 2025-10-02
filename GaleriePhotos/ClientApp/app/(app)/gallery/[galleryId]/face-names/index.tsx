import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { observer } from "mobx-react-lite";
import { FaceController } from "../../../../../services/face";
import { FaceName } from "../../../../../services/views";
import { useApiClient } from "folke-service-helpers";
import { useDirectoriesStore } from "@/stores/directories";
import { useRouter } from "expo-router";
import { useFaceNamesStore } from "@/stores/face-names";

const FaceNames = observer(function FaceNames() {
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
      <Text style={styles.faceNameText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Noms des visages</Text>
      <FlatList
        data={names}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFaceName}
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
  faceNameItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#f9f9f9",
    marginBottom: 8,
    borderRadius: 8,
  },
  faceNameText: {
    fontSize: 16,
    fontWeight: "500",
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

export default FaceNames;
