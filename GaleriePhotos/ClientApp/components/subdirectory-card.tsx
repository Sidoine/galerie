import React, { useCallback, useState } from "react";
import { observer } from "mobx-react-lite";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ImageBackground,
  Pressable,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useDirectoriesStore } from "@/stores/directories";
import { useDirectoryVisibilitiesStore } from "@/stores/directory-visibilities";
import { useMembersStore } from "@/stores/members";
import placeholder from "@/assets/placeholder.png";
import { usePhotosStore } from "@/stores/photos";
import { PhotoContainer, PhotoContainerStore } from "@/stores/photo-container";
import { Directory } from "@/services/views";
import { Link } from "expo-router";

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
    const [isHovering, setIsHovering] = useState(false);
    const [adminPanelExpanded, setAdminPanelExpanded] = useState(false);

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

    const imageSource = directory.coverPhotoId
      ? { uri: photosStore.getThumbnail(directory.coverPhotoId) }
      : placeholder;
    const isAdmin = membersStore.administrator;
    const adminControlsVisible = isAdmin && (isHovering || adminPanelExpanded);

    const handleMouseEnter = useCallback(() => {
      setIsHovering(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
      setIsHovering(false);
    }, []);

    const handleToggleAdminPanel = useCallback(() => {
      setAdminPanelExpanded((current) => !current);
    }, []);

    return (
      <Pressable
        style={[styles.card, { width: size }]}
        onHoverIn={handleMouseEnter}
        onHoverOut={handleMouseLeave}
      >
        <ImageBackground
          source={imageSource}
          style={[styles.imageBackground, { height: size * 0.75 }]}
          imageStyle={styles.image}
        >
          <View style={styles.content}>
            <Link href={store.getChildContainerLink(directory.id)} asChild>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.imagePressable}
                accessibilityRole="link"
              />
            </Link>
            <View
              style={[
                styles.overlay,
                { minHeight: adminControlsVisible ? 100 : 60 },
              ]}
            >
              <View style={styles.overlayTop}>
                <Link href={store.getChildContainerLink(directory.id)} asChild>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.overlayPressable}
                  >
                    <Text style={styles.title}>{directory.name}</Text>
                    <View style={styles.subtitleRow}>
                      {directory.numberOfPhotos > 0 && (
                        <Text style={styles.metaText}>
                          {directory.numberOfPhotos} élément
                          {directory.numberOfPhotos > 1 ? "s" : ""}
                        </Text>
                      )}
                      {isDirectory(directory) &&
                        directory.numberOfSubDirectories > 0 && (
                          <Text style={styles.metaText}>
                            {directory.numberOfSubDirectories} album
                            {directory.numberOfSubDirectories > 1 ? "s" : ""}
                          </Text>
                        )}
                    </View>
                  </TouchableOpacity>
                </Link>
                {isAdmin && (
                  <View style={styles.adminControlsArea}>
                    <TouchableOpacity
                      onPress={handleToggleAdminPanel}
                      style={[
                        styles.adminToggleButton,
                        adminControlsVisible && styles.adminToggleButtonActive,
                      ]}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={
                        adminControlsVisible
                          ? "Masquer les options administrateur"
                          : "Afficher les options administrateur"
                      }
                    >
                      <MaterialIcons
                        name={adminControlsVisible ? "close" : "settings"}
                        size={18}
                        color="#fff"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              {adminControlsVisible && (
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
        </ImageBackground>
      </Pressable>
    );
  }
);

export default SubdirectoryCard;

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    backgroundColor: "#000",
  },
  imageBackground: {
    justifyContent: "flex-end",
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
  },
  imagePressable: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 8,
    transitionProperty: "min-height",
    transitionDuration: "200ms",
  },
  overlayTop: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  overlayPressable: {
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  subtitleRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  metaText: {
    fontSize: 12,
    color: "#f0f0f0",
  },
  visibilityRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
    alignContent: "center",
    alignSelf: "stretch",
  },
  visibilityItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  visibilityIcon: {
    fontSize: 10,
    color: "#fff",
    marginLeft: 4,
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
  adminControlsArea: {
    gap: 8,
    alignItems: "flex-end",
    alignSelf: "stretch",
  },
  adminToggleButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  adminToggleButtonActive: {
    backgroundColor: "rgba(25, 118, 210, 0.9)",
    borderColor: "transparent",
  },
});
