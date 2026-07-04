import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Alert,
  Platform,
} from "react-native";
import { ActionMenu, ActionMenuItem } from "./action-menu";
import { DirectoryBulkDateModal } from "./modals/directory-bulk-date-modal";
import { DirectoryBulkLocationModal } from "./modals/directory-bulk-location-modal";
import { PhotoMoveModal } from "./modals/photo-move-modal";
import { AlbumCreateModal } from "./modals/album-create-modal";
import { MaterialIcons } from "@expo/vector-icons";
import { useSelectedPhotosStore } from "@/stores/selected-photos";
import { useCallback, useEffect, useState, useMemo } from "react";
import { observer } from "mobx-react-lite";
import { useMembersStore } from "@/stores/members";
import { useRouter } from "expo-router";
import { Directory } from "@/services/views";
import { useGalleryStore } from "@/stores/gallery";
import { PhotoContainerStore } from "@/stores/photo-container";
import { Link } from "expo-router";
import { useAlert } from "./alert";
import { CollectionAddModal } from "./modals/collection-add-modal";
import { useApiClient } from "folke-service-helpers";

function HeaderMenu({ store }: { store: PhotoContainerStore }) {
  const router = useRouter();
  const galleryStore = useGalleryStore();
  const apiClient = useApiClient();
  const [selectionMenuVisible, setSelectionMenuVisible] = useState(false);
  const [contextMenuVisible, setContextMenuVisible] = useState(false);
  const [bulkDateModalVisible, setBulkDateModalVisible] = useState(false);
  const [bulkLocationModalVisible, setBulkLocationModalVisible] =
    useState(false);
  const [moveModalVisible, setMoveModalVisible] = useState(false);
  const [createAlbumModalVisible, setCreateAlbumModalVisible] = useState(false);
  const [collectionModalVisible, setCollectionModalVisible] = useState(false);
  const [isZipDownloadInProgress, setIsZipDownloadInProgress] = useState(false);
  const selectedPhotosStore = useSelectedPhotosStore();

  const handleOpenSelectionMenu = useCallback(() => {
    setSelectionMenuVisible(true);
  }, []);

  const handleCloseSelectionMenu = useCallback(() => {
    setSelectionMenuVisible(false);
  }, []);

  const handleOpenContextMenu = useCallback(() => {
    setContextMenuVisible(true);
  }, []);

  const handleCloseContextMenu = useCallback(() => {
    setContextMenuVisible(false);
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

  const handleOpenCollectionModal = useCallback(() => {
    setCollectionModalVisible(true);
  }, []);

  const handleCloseCollectionModal = useCallback(() => {
    setCollectionModalVisible(false);
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
    [galleryStore.galleryId, router],
  );

  const handleClearSelection = useCallback(() => {
    selectedPhotosStore.clearSelection();
  }, [selectedPhotosStore]);

  const alert = useAlert();

  const getPhotoIdsToZip = useCallback(async () => {
    if (selectedPhotosStore.count > 0) {
      return selectedPhotosStore.photoIds;
    }

    const targetCount = 100;
    let previousLength = -1;
    while (
      store.paginatedPhotosStore.photos.length < targetCount &&
      store.paginatedPhotosStore.hasMore
    ) {
      const currentLength = store.paginatedPhotosStore.photos.length;
      if (currentLength === previousLength) {
        break;
      }

      previousLength = currentLength;
      await store.paginatedPhotosStore.loadMore();
    }

    return store.paginatedPhotosStore.photos
      .slice(0, targetCount)
      .map((photo) => photo.id);
  }, [
    selectedPhotosStore.count,
    selectedPhotosStore.photoIds,
    store.paginatedPhotosStore,
  ]);

  const downloadZipFromPhotoIds = useCallback(
    async (photoIds: number[]) => {
      if (Platform.OS !== "web") {
        alert(
          "Téléchargement indisponible",
          "Le téléchargement ZIP est disponible sur la version web.",
        );
        return;
      }

      const response = await apiClient.fetch(
        "api/photos/download-zip",
        "POST",
        JSON.stringify({ photoIds }),
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Impossible de télécharger le ZIP");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = globalThis.document?.createElement("a");
      if (!link) {
        URL.revokeObjectURL(objectUrl);
        throw new Error(
          "Le téléchargement n'est pas supporté sur ce navigateur",
        );
      }

      const now = new Date();
      const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
      link.href = objectUrl;
      link.download = `photos-${timestamp}.zip`;
      globalThis.document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    },
    [alert, apiClient],
  );

  const handleDownloadZip = useCallback(async () => {
    if (isZipDownloadInProgress) {
      return;
    }

    setIsZipDownloadInProgress(true);
    try {
      const photoIds = await getPhotoIdsToZip();
      if (photoIds.length === 0) {
        alert("Téléchargement ZIP", "Aucune photo disponible à télécharger.");
        return;
      }

      await downloadZipFromPhotoIds(photoIds);
    } catch (error) {
      console.error("Error downloading zip:", error);
      Alert.alert("Erreur", "Le téléchargement du ZIP a échoué.");
    } finally {
      setIsZipDownloadInProgress(false);
    }
  }, [
    alert,
    downloadZipFromPhotoIds,
    getPhotoIdsToZip,
    isZipDownloadInProgress,
  ]);

  const handleDeleteFromAlbum = useCallback(async () => {
    if (selectedPhotosStore.photoIds.length === 0) {
      alert("Erreur", "Aucune photo sélectionnée");
      return;
    }

    if (!store.deletePhotosFromAlbum) {
      return;
    }

    alert(
      store.deletePhotosFromAlbumLabel ?? "Supprimer de l'album",
      `${store.deletePhotosFromAlbumLabel?.startsWith("Supprimer de la collection") ? "Retirer" : "Déplacer"} ${selectedPhotosStore.count} photo${
        selectedPhotosStore.count > 1 ? "s" : ""
      }${store.deletePhotosFromAlbumLabel?.startsWith("Supprimer de la collection") ? " de la collection ?" : " vers la racine de la galerie ?"}`,
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await store.deletePhotosFromAlbum!(selectedPhotosStore.photoIds);
              selectedPhotosStore.clearSelection();
            } catch (error) {
              console.error("Error deleting photos from album:", error);
              Alert.alert("Erreur", "Une erreur est survenue");
            }
          },
        },
      ],
    );
  }, [selectedPhotosStore, alert, store]);

  const hasSelection = selectedPhotosStore.count > 0;
  const { administrator } = useMembersStore();

  const selectionMenuItems: ActionMenuItem[] = useMemo(() => {
    const items: ActionMenuItem[] = [
      {
        label: isZipDownloadInProgress
          ? "Préparation du ZIP..."
          : `Télécharger la sélection (${selectedPhotosStore.count}) en ZIP`,
        onPress: () => {
          void handleDownloadZip();
        },
        icon: <MaterialIcons name="archive" size={18} color="#1976d2" />,
      },
      {
        label: "Ajouter à une collection",
        onPress: handleOpenCollectionModal,
        icon: (
          <MaterialIcons
            name="collections-bookmark"
            size={18}
            color="#1976d2"
          />
        ),
      },
    ];

    if (administrator) {
      items.push(
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
      );
    }

    // Only show delete option if the function is defined
    if (administrator && store.deletePhotosFromAlbum) {
      items.push({
        label: store.deletePhotosFromAlbumLabel ?? "Supprimer de l'album",
        onPress: handleDeleteFromAlbum,
        icon: <MaterialIcons name="delete-outline" size={18} color="#d32f2f" />,
      });
    }

    items.push({
      label: `Désélectionner tout (${selectedPhotosStore.count})`,
      onPress: handleClearSelection,
      icon: <MaterialIcons name="clear" size={18} color="#c62828" />,
    });

    return items;
  }, [
    administrator,
    isZipDownloadInProgress,
    handleDownloadZip,
    handleOpenCollectionModal,
    handleOpenBulkDateModal,
    handleOpenBulkLocationModal,
    store.deletePhotosFromAlbum,
    store.deletePhotosFromAlbumLabel,
    handleDeleteFromAlbum,
    selectedPhotosStore.count,
    handleClearSelection,
  ]);

  const [canDisplaySlideshow, setCanDisplaySlideshow] = useState(false);

  const contextMenuItems: ActionMenuItem[] = useMemo(
    () => [
      {
        label: isZipDownloadInProgress
          ? "Préparation du ZIP..."
          : "Télécharger les 100 premières photos en ZIP",
        onPress: () => {
          void handleDownloadZip();
        },
        icon: <MaterialIcons name="archive" size={18} color="#1976d2" />,
      },
    ],
    [handleDownloadZip, isZipDownloadInProgress],
  );

  useEffect(() => {
    // Enable slideshow button only if there are more than 1 photo
    setCanDisplaySlideshow(store.paginatedPhotosStore.photos.length > 1);
  }, [store.paginatedPhotosStore.photos.length]);

  return (
    <>
      {canDisplaySlideshow && store.getSlideshowLink && (
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
      {!hasSelection && (
        <TouchableOpacity
          onPress={handleOpenContextMenu}
          style={styles.contextMenuButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Options de téléchargement"
          accessibilityRole="button"
        >
          <MaterialIcons name="more-vert" size={24} color="#007aff" />
        </TouchableOpacity>
      )}
      {hasSelection && (
        <View style={styles.selectionActions}>
          {administrator && (
            <>
              <TouchableOpacity
                onPress={handleOpenMoveModal}
                style={styles.moveButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Déplacer vers un album"
              >
                <MaterialIcons
                  name="drive-file-move"
                  size={24}
                  color="#007aff"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleOpenCreateAlbumModal}
                style={styles.createAlbumButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Créer un nouvel album"
              >
                <MaterialIcons
                  name="create-new-folder"
                  size={24}
                  color="#007aff"
                />
              </TouchableOpacity>
            </>
          )}
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
      <ActionMenu
        visible={contextMenuVisible}
        onClose={handleCloseContextMenu}
        items={contextMenuItems}
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
      <CollectionAddModal
        visible={collectionModalVisible}
        photoIds={selectedPhotosStore.photoIds}
        onClose={handleCloseCollectionModal}
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
  contextMenuButton: {
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
