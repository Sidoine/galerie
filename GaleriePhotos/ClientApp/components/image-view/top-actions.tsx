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
import { PhotoMoveModal } from "../modals/photo-move-modal";
import { useAlert } from "../alert";
import { useShare } from "../modals/photo-share";

interface TopActionsProps {
  onDetailsToggle: () => void;
  onFacesToggle: () => void;
  showFaces?: boolean;
  onClose: () => void;
  photo: PhotoFull;
  store: PhotoContainerStore;
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
  const [moveModalVisible, setMoveModalVisible] = useState(false);

  const openMenu = useCallback(() => setMenuVisible(true), []);
  const closeMenu = useCallback(() => setMenuVisible(false), []);

  const openMoveModal = useCallback(() => {
    closeMenu();
    setMoveModalVisible(true);
  }, [closeMenu]);
  const closeMoveModal = useCallback(() => setMoveModalVisible(false), []);

  const handleCoverClick = useCallback(() => {
    closeMenu();
    store.setCover?.(photo.id);
  }, [closeMenu, store, photo.id]);

  const [share, canShare] = useShare();

  const handleSystemShareClick = useCallback(async () => {
    closeMenu();
    await share(photo);
  }, [closeMenu, photo, share]);

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

  const alert = useAlert();

  const handleDeleteFromAlbum = useCallback(() => {
    closeMenu();
    if (!store.deletePhotosFromAlbum) {
      return;
    }

    alert(
      "Supprimer de l'album",
      "Déplacer cette photo vers la racine de la galerie ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await store.deletePhotosFromAlbum?.([photo.id]);
            } catch (error) {
              console.error("Error deleting photo from album:", error);
            }
          },
        },
      ]
    );
  }, [alert, closeMenu, photo.id, store]);

  const handleMoveSuccess = useCallback(() => {
    closeMoveModal();
    directoriesStore.clearCache();
    store.navigateToContainer();
  }, [closeMoveModal, directoriesStore, store]);

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
      { label: "Déplacer vers un album", onPress: openMoveModal }
    );
    if (store.deletePhotosFromAlbum) {
      items.push({
        label: "Supprimer de l'album",
        onPress: handleDeleteFromAlbum,
      });
    }
    items.push(
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
      <PhotoMoveModal
        visible={moveModalVisible}
        photoIds={[photo.id]}
        onClose={closeMoveModal}
        onSuccess={handleMoveSuccess}
      />
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
