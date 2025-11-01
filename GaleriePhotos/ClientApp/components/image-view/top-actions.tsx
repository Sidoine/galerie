import React, { useCallback, useEffect, useState } from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { PhotoFull } from "@/services/views";
import { useDirectoriesStore } from "@/stores/directories";
import { useMembersStore } from "@/stores/members";
import { FaceDetectionStatus } from "@/services/enums";
import Icon from "../Icon";
import * as Sharing from "expo-sharing";
import { Directory, File, Paths } from "expo-file-system";
import { theme } from "@/stores/theme";
import { usePhotosStore } from "@/stores/photos";
import { observer } from "mobx-react-lite";
import { PhotoContainerStore } from "@/stores/photo-container";
import { DirectoryBulkDateModal } from "../modals/directory-bulk-date-modal";
import { DirectoryBulkLocationModal } from "../modals/directory-bulk-location-modal";
import { ActionMenu, ActionMenuItem } from "../action-menu";
import { useFavoritesStore } from "@/stores/favorites";

interface TopActionsProps {
  onDetailsToggle: () => void;
  onFacesToggle: () => void;
  showFaces?: boolean;
  onClose: () => void;
  photo: PhotoFull;
  store: PhotoContainerStore;
}

function getMimeTypeFromExtension(extension: string) {
  switch (extension.toLowerCase()) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "mp4":
      return "video/mp4";
    case "mov":
      return "video/quicktime";
    case "webm":
      return "video/webm";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

function TopActions({
  onDetailsToggle,
  onFacesToggle,
  showFaces,
  onClose,
  photo,
  store,
}: TopActionsProps) {
  const directoriesStore = useDirectoriesStore();
  const photosStore = usePhotosStore();
  const membersStore = useMembersStore();
  const [menuVisible, setMenuVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  const openMenu = useCallback(() => setMenuVisible(true), []);
  const closeMenu = useCallback(() => setMenuVisible(false), []);

  const handleCoverClick = useCallback(() => {
    closeMenu();
    store.setCover?.(photo.id);
  }, [closeMenu, store, photo.id]);

  const handleShareVisibilityClick = useCallback(async () => {
    closeMenu();
    await photosStore.setAccess(photo, false);
    directoriesStore.clearCache();
    store.navigateToContainer();
  }, [closeMenu, photosStore, photo, directoriesStore, store]);

  const handleUnshareVisibilityClick = useCallback(async () => {
    closeMenu();
    await photosStore.setAccess(photo, true);
    directoriesStore.clearCache();
    store.navigateToContainer();
  }, [closeMenu, photosStore, photo, directoriesStore, store]);
  const [canShare, setCanShare] = useState(false);
  useEffect(() => {
    async function checkSharingAvailability() {
      const available = await Sharing.isAvailableAsync();
      setCanShare(available);
    }
    checkSharingAvailability();
  }, []);

  const handleSystemShareClick = useCallback(async () => {
    closeMenu();
    if (!canShare) return;

    // Construction de l'URL distante de l'image (originale) via store
    const imageUrl = photosStore.getImage(photo.publicId);

    // Télécharger l'image dans un fichier temporaire (obligatoire pour expo-sharing sur mobile)
    if (Platform.OS !== "web") {
      const fileName = `shared-${photo.publicId}.jpg`;
      const baseDir = Paths.cache;
      const tmpPath = `${baseDir}${fileName}`;
      const download = await File.downloadFileAsync(
        imageUrl,
        new Directory(tmpPath)
      );
      await Sharing.shareAsync(download.uri, {
        dialogTitle: "Partager l'image",
        mimeType: download.type,
      });
    } else {
      await Sharing.shareAsync(imageUrl, {
        dialogTitle: "Partager l'image",
        mimeType: getMimeTypeFromExtension(imageUrl.split(".").pop() || "jpg"),
      });
    }
  }, [canShare, closeMenu, photo.publicId, photosStore]);

  const handleRotate = useCallback(
    async (angle: number) => {
      closeMenu();
      await photosStore.rotatePhoto(photo, angle);
    },
    [closeMenu, photosStore, photo]
  );
  const handleRotateLeft = useCallback(() => handleRotate(270), [handleRotate]);
  const handleRotateRight = useCallback(() => handleRotate(90), [handleRotate]);

  const openDateModal = useCallback(() => {
    closeMenu();
    setDateModalVisible(true);
  }, [closeMenu]);
  const openLocationModal = useCallback(() => {
    closeMenu();
    setLocationModalVisible(true);
  }, [closeMenu]);
  const closeDateModal = useCallback(() => setDateModalVisible(false), []);
  const closeLocationModal = useCallback(
    () => setLocationModalVisible(false),
    []
  );

  const favoritesStore = useFavoritesStore();

  const handleToggleFavorite = useCallback(async () => {
    await photosStore.toggleFavorite(photo);
    favoritesStore.paginatedPhotosStore.clear();
  }, [photosStore, photo, favoritesStore.paginatedPhotosStore]);

  const items: ActionMenuItem[] = [];
  if (membersStore.administrator) {
    if (store.setCover) {
      items.push({
        label: "Utiliser comme couverture",
        onPress: handleCoverClick,
      });
    }
    items.push(
      { label: "Tourner à droite", onPress: handleRotateRight },
      { label: "Tourner à gauche", onPress: handleRotateLeft },
      photo.private
        ? { label: "Rendre publique", onPress: handleShareVisibilityClick }
        : { label: "Rendre privée", onPress: handleUnshareVisibilityClick },
      { label: "Changer la date", onPress: openDateModal },
      { label: "Changer la localisation", onPress: openLocationModal }
    );
  }
  if (canShare) {
    items.push({ label: "Partager...", onPress: handleSystemShareClick });
  }

  return (
    <View style={styles.container}>
      <View style={styles.leftGroup}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Retour à la galerie"
          onPress={onClose}
          style={styles.iconButton}
        >
          <Icon name="arrow-back" set="ion" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.rightGroup}>
        {photo.faceDetectionStatus === FaceDetectionStatus.Completed && (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onFacesToggle}
            style={styles.iconButton}
          >
            {showFaces ? (
              <Icon
                name="emoticon-happy-outline"
                set="mci"
                size={22}
                color="#fff"
              />
            ) : (
              <Icon
                name="emoticon-neutral-outline"
                set="mci"
                size={22}
                color="#fff"
              />
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={
            photo.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
          }
          onPress={handleToggleFavorite}
          style={styles.iconButton}
        >
          <Icon
            name={photo.isFavorite ? "star" : "star-outline"}
            set="mci"
            size={22}
            color={photo.isFavorite ? "#FFD700" : "#fff"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onDetailsToggle}
          style={styles.iconButton}
        >
          <Icon name="information-outline" set="mci" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={openMenu}
          style={styles.iconButton}
        >
          <Icon name="dots-vertical" set="mci" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <ActionMenu visible={menuVisible} onClose={closeMenu} items={items} />
      {dateModalVisible && (
        <DirectoryBulkDateModal
          visible={dateModalVisible}
          photoIds={[photo.id]}
          directoryPath={photo.name}
          onClose={closeDateModal}
        />
      )}
      {locationModalVisible && (
        <DirectoryBulkLocationModal
          visible={locationModalVisible}
          photos={[photo]}
          onClose={closeLocationModal}
          overwriteExisting
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1),
    backgroundColor: "rgba(0,0,0,0.4)",
    zIndex: 1,
  },
  leftGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(2),
  },
});
export default observer(TopActions);
