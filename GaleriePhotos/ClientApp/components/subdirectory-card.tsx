import React, { useCallback } from "react";
import { observer } from "mobx-react-lite";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Switch,
} from "react-native";
import { Directory } from "@/services/views";
import { useDirectoriesStore } from "@/stores/directories";
import { useDirectoryVisibilitiesStore } from "@/stores/directory-visibilities";
import { useMembersStore } from "@/stores/members";
import placeholder from "@/assets/placeholder.png";
import { StackNavigationProp } from "@react-navigation/stack";
import { useRouter } from "expo-router";

const SubdirectoryCard = observer(({ directory }: { directory: Directory }) => {
  const directoriesStore = useDirectoriesStore();
  const visibilitiesStore = useDirectoryVisibilitiesStore();
  const membersStore = useMembersStore();
  const visibilities = visibilitiesStore.visibilities;
  const router = useRouter();

  const handleNavigate = useCallback(() => {
    router.push({
      pathname: "/gallery/[galleryId]/directory/[directoryId]",
      params: {
        galleryId: directoriesStore.galleryId,
        directoryId: directory.id,
        order: "date-desc",
      },
    });
  }, [router, directory.id]);

  const handleUseAsParentCover = useCallback(async () => {
    try {
      await directoriesStore.setParentCover(directory.id);
    } catch (error) {
      console.error("Failed to set parent cover:", error);
    }
  }, [directory.id, directoriesStore]);

  const toggleVisibility = useCallback(
    (visibilityValue: number) => (value: boolean) => {
      let newVisibility = directory.visibility & ~visibilityValue;
      if (value) newVisibility |= visibilityValue;
      directoriesStore.patchDirectory(directory, { visibility: newVisibility });
    },
    [directory, directoriesStore]
  );

  return (
    <View style={styles.card}>
      <TouchableOpacity onPress={handleNavigate}>
        <View style={styles.imageWrapper}>
          {directory.coverPhotoId && (
            <Image
              source={{
                uri: directoriesStore.getThumbnail(directory.coverPhotoId),
              }}
              style={styles.image}
              resizeMode="cover"
            />
          )}
          {!directory.coverPhotoId && (
            <Image
              source={placeholder as any}
              style={styles.image}
              resizeMode="cover"
            />
          )}
        </View>
      </TouchableOpacity>
      <View style={styles.meta}>
        <Text style={styles.title}>{directory.name}</Text>
        <View style={styles.subtitleRow}>
          {directory.numberOfPhotos > 0 && (
            <Text style={styles.metaText}>
              {directory.numberOfPhotos} élément
              {directory.numberOfPhotos > 1 ? "s" : ""}
            </Text>
          )}
          {directory.numberOfSubDirectories > 0 && (
            <Text style={styles.metaText}>
              {directory.numberOfSubDirectories} album
              {directory.numberOfSubDirectories > 1 ? "s" : ""}
            </Text>
          )}
        </View>
        {membersStore.administrator && (
          <View style={styles.visibilityRow}>
            {visibilities.map((v) => (
              <View key={v.id} style={styles.visibilityItem}>
                <Switch
                  value={(directory.visibility & v.value) > 0}
                  onValueChange={toggleVisibility(v.value)}
                />
                <Text style={styles.visibilityIcon}>{v.name || ""}</Text>
              </View>
            ))}
          </View>
        )}
        {membersStore.administrator && directory.coverPhotoId && (
          <TouchableOpacity
            onPress={handleUseAsParentCover}
            style={styles.actionButton}
          >
            <Text style={styles.actionButtonText}>
              Utiliser comme couverture parente
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

export default SubdirectoryCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
  },
  imageWrapper: {
    height: 160,
    backgroundColor: "#eee",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  meta: {
    padding: 10,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  subtitleRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  metaText: {
    fontSize: 12,
    color: "#555",
  },
  visibilityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  visibilityItem: {
    alignItems: "center",
  },
  visibilityIcon: {
    fontSize: 10,
    color: "#333",
  },
  actionButton: {
    marginTop: 8,
    backgroundColor: "#1976d2",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  actionButtonText: {
    color: "white",
    fontSize: 12,
    textAlign: "center",
  },
});
