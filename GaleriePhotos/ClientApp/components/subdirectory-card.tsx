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
import { useDirectoriesStore } from "@/stores/directories";
import { useDirectoryVisibilitiesStore } from "@/stores/directory-visibilities";
import { useMembersStore } from "@/stores/members";
import placeholder from "@/assets/placeholder.png";
import { usePhotosStore } from "@/stores/photos";
import { PhotoContainer, PhotoContainerStore } from "@/stores/photo-container";
import { Directory } from "@/services/views";

function isDirectory(object: PhotoContainer): object is Directory {
  return (object as Directory).numberOfSubDirectories !== undefined;
}

const SubdirectoryCard = observer(
  ({
    directory,
    size,
    store,
  }: {
    directory: PhotoContainer;
    size: number;
    store: PhotoContainerStore;
  }) => {
    const directoriesStore = useDirectoriesStore();
    const photosStore = usePhotosStore();
    const visibilitiesStore = useDirectoryVisibilitiesStore();
    const membersStore = useMembersStore();
    const visibilities = visibilitiesStore.visibilities;

    const handleNavigate = useCallback(() => {
      store.navigateToChildContainer(directory.id);
    }, [store, directory.id]);

    const handleUseAsParentCover = useCallback(async () => {
      if (store.setParentCover) await store.setParentCover(directory.id);
    }, [store, directory.id]);

    const toggleVisibility = useCallback(
      (visibilityValue: number) => (value: boolean) => {
        if (!isDirectory(directory)) return;
        let newVisibility = directory.visibility & ~visibilityValue;
        if (value) newVisibility |= visibilityValue;
        directoriesStore.patchDirectory(directory, {
          visibility: newVisibility,
        });
      },
      [directory, directoriesStore]
    );

    return (
      <View style={[styles.card, { width: size }]}>
        <TouchableOpacity onPress={handleNavigate}>
          <View style={styles.imageWrapper}>
            {directory.coverPhotoId && (
              <Image
                source={{
                  uri: photosStore.getThumbnail(directory.coverPhotoId),
                }}
                style={styles.image}
                resizeMode="cover"
              />
            )}
            {!directory.coverPhotoId && (
              <Image
                source={placeholder}
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
            {isDirectory(directory) && directory.numberOfSubDirectories > 0 && (
              <Text style={styles.metaText}>
                {directory.numberOfSubDirectories} album
                {directory.numberOfSubDirectories > 1 ? "s" : ""}
              </Text>
            )}
          </View>
          {membersStore.administrator && (
            <View style={styles.visibilityRow}>
              {isDirectory(directory) &&
                visibilities.map((v) => (
                  <View key={v.id} style={styles.visibilityItem}>
                    <Switch
                      value={(directory.visibility & v.value) > 0}
                      onValueChange={toggleVisibility(v.value)}
                    />
                    <Text style={styles.visibilityIcon}>{v.icon}</Text>
                  </View>
                ))}
              {store.setParentCover && (
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
          )}
        </View>
      </View>
    );
  }
);

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
    alignContent: "center",
  },
  visibilityItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  visibilityIcon: {
    fontSize: 10,
    color: "#333",
  },
  actionButton: {
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
