import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import { PhotoFull } from "@/services/views";
import { useDirectoriesStore } from "@/stores/directories";
import { useMembersStore } from "@/stores/members";
import { FaceDetectionStatus } from "@/services/enums";
import Icon from "../Icon";
import * as Sharing from "expo-sharing";
import { theme } from "@/stores/theme";
import { usePhotosStore } from "@/stores/photos";
import { observer } from "mobx-react-lite";

interface TopActionsProps {
  onDetailsToggle: () => void;
  onFacesToggle: () => void;
  showFaces?: boolean;
  onClose: () => void;
  photo: PhotoFull;
}

// Remplacement des icônes MUI par de simples caractères/abréviations temporaires.
// Pour une future amélioration on pourra intégrer une librairie d'icônes RN.

function TopActions({
  onDetailsToggle,
  onFacesToggle,
  showFaces,
  onClose,
  photo,
}: TopActionsProps) {
  const directoriesStore = useDirectoriesStore();
  const photosStore = usePhotosStore();
  const membersStore = useMembersStore();
  const [menuVisible, setMenuVisible] = useState(false);

  const openMenu = useCallback(() => setMenuVisible(true), []);
  const closeMenu = useCallback(() => setMenuVisible(false), []);

  const handleCoverClick = useCallback(() => {
    closeMenu();
    directoriesStore.patchDirectoryAndClearCache(photo.directoryId, {
      coverPhotoId: photo.id,
    });
  }, [closeMenu, directoriesStore, photo.directoryId, photo.id]);

  const handleShareVisibilityClick = useCallback(() => {
    closeMenu();
    photosStore.setAccess(photo, false);
  }, [closeMenu, photosStore, photo]);

  const handleUnshareVisibilityClick = useCallback(() => {
    closeMenu();
    photosStore.setAccess(photo, true);
  }, [closeMenu, photosStore, photo]);
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
    try {
      if (!canShare) return;

      // Construction de l'URL distante de l'image (originale) via store
      const imageUrl = photosStore.getImage(photo.publicId);

      // Télécharger l'image dans un fichier temporaire (obligatoire pour expo-sharing sur mobile)
      // const fileName = `shared-${photo.publicId}.jpg`;
      // const FS = FileSystem.Paths;
      // const baseDir =
      //   FS..cacheDirectory || FS.documentDirectory || FS.bundleDirectory || "";
      // const tmpPath = `${baseDir}${fileName}`;
      // const download = await FileSystem.downloadAsync(imageUrl, tmpPath);

      await Sharing.shareAsync(imageUrl, {
        dialogTitle: "Partager l'image",
        mimeType: "image/jpeg",
      });
    } catch (err) {
      // TODO: éventuellement gestion d'erreur utilisateur (toast)
      console.warn("Erreur lors du partage", err);
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

  return (
    <View style={styles.container}>
      <View style={styles.leftGroup}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onClose}
          style={styles.iconButton}
        >
          <Icon name="arrow-back" set="ion" size={22} />
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
              <Icon name="emoticon-happy-outline" set="mci" size={22} />
            ) : (
              <Icon name="emoticon-neutral-outline" set="mci" size={22} />
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onDetailsToggle}
          style={styles.iconButton}
        >
          <Icon name="information-outline" set="mci" size={22} />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={openMenu}
          style={styles.iconButton}
        >
          <Icon name="dots-vertical" set="mci" size={24} />
        </TouchableOpacity>
      </View>
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.menuOverlay} onPress={closeMenu}>
          <View style={styles.menu}>
            {membersStore.administrator && (
              <>
                <MenuItem
                  label="Utiliser comme couverture"
                  onPress={handleCoverClick}
                />
                <MenuItem
                  label="Tourner à droite"
                  onPress={handleRotateRight}
                />
                <MenuItem label="Tourner à gauche" onPress={handleRotateLeft} />
                {photo.private && (
                  <MenuItem
                    label="Rendre publique (lien)"
                    onPress={handleShareVisibilityClick}
                  />
                )}
                {!photo.private && (
                  <MenuItem
                    label="Rendre privée"
                    onPress={handleUnshareVisibilityClick}
                  />
                )}
              </>
            )}
            {canShare && (
              <MenuItem label="Partager..." onPress={handleSystemShareClick} />
            )}
            <MenuItem label="Fermer" onPress={closeMenu} />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function MenuItem({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.menuItem}>
      <Text style={styles.menuItemText}>{label}</Text>
    </TouchableOpacity>
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
  menuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  menu: {
    backgroundColor: "#222",
    paddingVertical: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuItemText: {
    color: "white",
    fontSize: 16,
  },
});
export default observer(TopActions);
