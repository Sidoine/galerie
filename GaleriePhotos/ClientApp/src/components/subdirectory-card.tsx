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
import { Directory } from "../services/views";
import { useNavigation } from "@react-navigation/native";
import { useDirectoriesStore } from "../stores/directories";
import { useDirectoryVisibilitiesStore } from "../stores/directory-visibilities";
import { useMembersStore } from "../stores/members";
import placeholder from "../assets/placeholder.png";
import { GalleryStackParamList } from "../navigation-types";
import { StackNavigationProp } from "@react-navigation/stack";

const SubdirectoryCard = observer(({ directory }: { directory: Directory }) => {
  const navigation =
    useNavigation<StackNavigationProp<GalleryStackParamList>>();
  const directoriesStore = useDirectoriesStore();
  const visibilitiesStore = useDirectoryVisibilitiesStore();
  const membersStore = useMembersStore();
  const visibilities = visibilitiesStore.visibilities;

  const handleNavigate = useCallback(() => {
    navigation.navigate("Directory", {
      galleryId: directoriesStore.galleryId,
      directoryId: directory.id,
      order: "date-desc",
    });
  }, [navigation, directory.id]);

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
    <TouchableOpacity style={styles.card} onPress={handleNavigate}>
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
                <Text style={styles.visibilityIcon}>
                  {/* Simplification: strip HTML icon, could map to unicode */}
                  {v.name || ""}
                </Text>
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
    </TouchableOpacity>
  );
});

export default SubdirectoryCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
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
