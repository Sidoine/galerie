import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { ActionMenu, ActionMenuItem } from "./action-menu";
import { DirectoryBulkDateModal } from "./modals/directory-bulk-date-modal";
import { DirectoryBulkLocationModal } from "./modals/directory-bulk-location-modal";
import { PhotoMoveModal } from "./modals/photo-move-modal";
import { AlbumCreateModal } from "./modals/album-create-modal";
import { MaterialIcons } from "@expo/vector-icons";
import { useSelectedPhotosStore } from "@/stores/selected-photos";
import { useCallback, useState } from "react";
import { observer } from "mobx-react-lite";
import { useMembersStore } from "@/stores/members";
import { useRouter } from "expo-router";
import { Directory } from "@/services/views";
import { useGalleryStore } from "@/stores/gallery";
import { PhotoContainerStore } from "@/stores/photo-container";
import { Link } from "expo-router";

function HeaderMenu({ store }: { store: PhotoContainerStore }) {
  const router = useRouter();
  const galleryStore = useGalleryStore();
  const [selectionMenuVisible, setSelectionMenuVisible] = useState(false);
  const [bulkDateModalVisible, setBulkDateModalVisible] = useState(false);
  const [bulkLocationModalVisible, setBulkLocationModalVisible] =
    useState(false);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [createAlbumModalVisible, setCreateAlbumModalVisible] = useState(false);
  const selectedPhotosStore = useSelectedPhotosStore();

  const handleOpenSelectionMenu = useCallback(() => {
    setSelectionMenuVisible(true);
  }, []);

  const handleCloseSelectionMenu = useCallback(() => {
    setSelectionMenuVisible(false);
  }, []);

  const handleOpenBulkDateModal = useCallback(() => {
    setBulkDateModalVisible(true);
  }, []);

  const handleCloseBulkDateModal = useCallback(() => {
    setBulkDateModalVisible(false);
  }, []);

  const handleOpenBulkLocationModal = useCallback(() => {
    setBulkLocationModalVisible(true);
  }, []);

  const handleCloseBulkLocationModal = useCallback(() => {
    setBulkLocationModalVisible(false);
  }, []);

  const handleOpenMoveModal = useCallback(() => {
    setMoveModalVisible(true);
  }, []);

  const handleCloseMoveModal = useCallback(() => {
    setMoveModalVisible(false);
  }, []);

  const handleOpenCreateAlbumModal = useCallback(() => {
    setCreateAlbumModalVisible(true);
  }, []);

  const handleCloseCreateAlbumModal = useCallback(() => {
    setCreateAlbumModalVisible(false);
  }, []);

  const handleMoveOrCreateAlbumSuccess = useCallback(
    (directory: Directory) => {
      router.push({
        pathname: "/(app)/gallery/[galleryId]/directory/[directoryId]",
        params: {
          directoryId: directory.id.toString(),
          galleryId: galleryStore.galleryId,
        },
      });
    },
    [galleryStore.galleryId, router]
  );

  const handleClearSelection = useCallback(() => {
    selectedPhotosStore.clearSelection();
  }, [selectedPhotosStore]);

  const hasSelection = selectedPhotosStore.count > 0;
  const { administrator } = useMembersStore();

  const selectionMenuItems: ActionMenuItem[] = [
    {
      label: "Changer la date",
      onPress: handleOpenBulkDateModal,
      icon: <MaterialIcons name="event" size={18} color="#1976d2" />,
    },
    {
      label: "Changer la position (GPS)",
      onPress: handleOpenBulkLocationModal,
      icon: <MaterialIcons name="my-location" size={18} color="#1976d2" />,
    },
    {
      label: `Désélectionner tout (${selectedPhotosStore.count})`,
      onPress: handleClearSelection,
      icon: <MaterialIcons name="clear" size={18} color="#c62828" />,
    },
  ];

  return (
    <>
      {store.paginatedPhotosStore.photos.length > 0 && (
        <Link href={store.getSlideshowLink()} asChild>
          <TouchableOpacity
            style={styles.slideshowButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Lancer le diaporama"
            accessibilityRole="button"
          >
            <MaterialIcons name="slideshow" size={24} color="#007aff" />
          </TouchableOpacity>
        </Link>
      )}
      {hasSelection && administrator && (
        <View style={styles.selectionActions}>
          <TouchableOpacity
            onPress={handleOpenMoveModal}
            style={styles.moveButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Déplacer vers un album"
          >
            <MaterialIcons name="drive-file-move" size={24} color="#007aff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleOpenCreateAlbumModal}
            style={styles.createAlbumButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Créer un nouvel album"
          >
            <MaterialIcons name="create-new-folder" size={24} color="#007aff" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleOpenSelectionMenu}
            style={styles.selectionMenuButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Options pour les photos sélectionnées"
          >
            <Text style={styles.selectionCount}>
              {selectedPhotosStore.count}
            </Text>
            <MaterialIcons name="more-vert" size={24} color="#007aff" />
          </TouchableOpacity>
        </View>
      )}
      <ActionMenu
        visible={selectionMenuVisible}
        onClose={handleCloseSelectionMenu}
        items={selectionMenuItems}
      />
      <DirectoryBulkDateModal
        visible={bulkDateModalVisible}
        photoIds={selectedPhotosStore.photoIds}
        directoryPath=""
        onClose={handleCloseBulkDateModal}
      />
      <DirectoryBulkLocationModal
        visible={bulkLocationModalVisible}
        photos={selectedPhotosStore.photos}
        onClose={handleCloseBulkLocationModal}
      />
      <PhotoMoveModal
        visible={moveModalVisible}
        photoIds={selectedPhotosStore.photoIds}
        onClose={handleCloseMoveModal}
        onSuccess={handleMoveOrCreateAlbumSuccess}
      />
      <AlbumCreateModal
        visible={createAlbumModalVisible}
        photoIds={selectedPhotosStore.photoIds}
        onClose={handleCloseCreateAlbumModal}
        onSuccess={handleMoveOrCreateAlbumSuccess}
      />
    </>
  );
}

export default observer(HeaderMenu);

const styles = StyleSheet.create({
  slideshowButton: {
    padding: 4,
    marginRight: 4,
  },
  selectionActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  moveButton: {
    padding: 4,
    marginRight: 4,
  },
  createAlbumButton: {
    padding: 4,
    marginRight: 4,
  },
  selectionMenuButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
  },
  selectionCount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007aff",
  },
});
