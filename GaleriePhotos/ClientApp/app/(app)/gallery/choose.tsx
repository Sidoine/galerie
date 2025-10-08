import React, { useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { observer } from "mobx-react-lite";
import { useGalleriesStore } from "../../../stores/galleries";
import { useLocalSearchParams, useRouter } from "expo-router";

function GalleryItem({
  galleryId,
  galleryName,
}: {
  galleryId: number;
  galleryName: string;
}) {
  const router = useRouter();
  const handleClick = useCallback(() => {
    router.navigate({
      pathname: `/(app)/gallery/[galleryId]`,
      params: { galleryId },
    });
  }, [galleryId, router]);
  return (
    <TouchableOpacity style={styles.galleryButton} onPress={handleClick}>
      <Text style={styles.galleryText}>{galleryName}</Text>
    </TouchableOpacity>
  );
}

const GalleriesScreen = observer(function GalleryChooser() {
  const router = useRouter();
  const galleriesStore = useGalleriesStore();
  const { galleryId } = useLocalSearchParams<{ galleryId?: string }>();

  useEffect(() => {
    if (!galleriesStore.memberships && !galleriesStore.loading) {
      galleriesStore.load();
    }
  }, [galleriesStore, galleriesStore.loading, galleriesStore.memberships]);

  const memberships = galleriesStore.memberships;

  useEffect(() => {
    if (
      memberships &&
      memberships.length === 1 &&
      galleryId !== String(memberships[0].galleryId)
    ) {
      const targetGalleryId = memberships[0].galleryId;
      router.navigate({
        pathname: `/(app)/gallery/[galleryId]`,
        params: { galleryId: targetGalleryId },
      });
    }
  }, [galleryId, memberships, router]);

  if (!memberships) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {memberships.map((m) => (
        <GalleryItem
          key={m.galleryId}
          galleryId={m.galleryId}
          galleryName={m.galleryName}
        />
      ))}
      {memberships.length === 0 && (
        <Text style={styles.noGalleryText}>
          Vous n'êtes membre d'aucune galerie. Demandez à en rejoindre une ou
          demandez à l'administrateur de créer une nouvelle galerie.
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  galleryButton: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#f5f5f5",
    marginBottom: 8,
    borderRadius: 8,
  },
  galleryText: {
    fontSize: 16,
    color: "#333",
  },
  noGalleryText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 32,
    padding: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
  },
});

export default GalleriesScreen;
