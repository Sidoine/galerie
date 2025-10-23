import { PhotoContainerStore } from "@/stores/photo-container";
import { Link } from "expo-router";
import { observer } from "mobx-react-lite";
import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { EditNameModal } from "@/components/modals/edit-name-modal";
import { usePhotoSelectionStore } from "@/stores/photo-selection";
import { ActionMenu, ActionMenuItem } from "@/components/action-menu";
import { DirectoryBulkDateModal } from "@/components/modals/directory-bulk-date-modal";
import { DirectoryBulkLocationModal } from "@/components/modals/directory-bulk-location-modal";
import { Photo } from "@/services/views";

function BreadCrumbs({ store }: { store: PhotoContainerStore }) {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const selectionStore = usePhotoSelectionStore();
  const [selectionMenuVisible, setSelectionMenuVisible] = useState(false);
  const [bulkDateModalVisible, setBulkDateModalVisible] = useState(false);
  const [bulkLocationModalVisible, setBulkLocationModalVisible] = useState(false);
  
  const handleOpenEditModal = useCallback(() => {
    setEditModalVisible(true);
  }, []);
  
  const handleCloseEditModal = useCallback(() => {
    setEditModalVisible(false);
  }, []);
  
  const handleSaveName = useCallback(
    async (newName: string) => {
      if (store.renameContainer) {
        await store.renameContainer(newName);
      }
    },
    [store]
  );

  const handleOpenSelectionMenu = useCallback(() => {
    setSelectionMenuVisible(true);
  }, []);

  const handleCloseSelectionMenu = useCallback(() => {
    setSelectionMenuVisible(false);
  }, []);

  const handleOpenBulkDate = useCallback(() => {
    setBulkDateModalVisible(true);
  }, []);

  const handleCloseBulkDate = useCallback(() => {
    setBulkDateModalVisible(false);
  }, []);

  const handleOpenBulkLocation = useCallback(() => {
    setBulkLocationModalVisible(true);
  }, []);

  const handleCloseBulkLocation = useCallback(() => {
    setBulkLocationModalVisible(false);
  }, []);

  // Get selected photos from the paginated store
  const paginatedPhotos = store.paginatedPhotosStore?.photos || [];
  const selectedPhotos = selectionStore.selectedPhotosArray
    .map((id) => paginatedPhotos.find((p: Photo) => p.id === id))
    .filter((p): p is Photo => p !== undefined);

  if (!store.breadCrumbs) return <Text>Galerie photo</Text>;
  
  const lastCrumb = store.breadCrumbs[store.breadCrumbs.length - 1];
  const currentName = lastCrumb?.name || "";
  
  const selectionMenuItems: ActionMenuItem[] = [
    {
      label: "Modifier la date",
      onPress: handleOpenBulkDate,
      icon: <MaterialIcons name="calendar-today" size={18} color="#1976d2" />,
    },
    {
      label: "Modifier la position",
      onPress: handleOpenBulkLocation,
      icon: <MaterialIcons name="my-location" size={18} color="#1976d2" />,
    },
  ];
  
  return (
    <>
      <View style={styles.container}>
        <View style={styles.breadCrumbsWrapper}>
          {store.breadCrumbs.map((crumb, index) => (
            <Link key={index} href={crumb.url} style={[styles.text]}>
              <Text style={{ color: "#007aff" }}>{crumb.name}</Text>
              {index < store.breadCrumbs.length - 1 && <Text> &gt;</Text>}
            </Link>
          ))}
          {store.renameContainer && (
            <TouchableOpacity
              onPress={handleOpenEditModal}
              style={styles.editButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="edit" size={20} color="#007aff" />
            </TouchableOpacity>
          )}
        </View>
        {selectionStore.hasSelection && (
          <View style={styles.selectionContainer}>
            <Text style={styles.selectionText}>
              {selectionStore.selectedCount} sélectionnée{selectionStore.selectedCount > 1 ? "s" : ""}
            </Text>
            <TouchableOpacity
              onPress={handleOpenSelectionMenu}
              style={styles.moreButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="more-vert" size={24} color="#007aff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
      {store.renameContainer && (
        <EditNameModal
          visible={editModalVisible}
          currentName={currentName}
          onClose={handleCloseEditModal}
          onSave={handleSaveName}
        />
      )}
      <ActionMenu
        visible={selectionMenuVisible}
        onClose={handleCloseSelectionMenu}
        items={selectionMenuItems}
      />
      <DirectoryBulkDateModal
        visible={bulkDateModalVisible}
        photoIds={selectionStore.selectedPhotosArray}
        directoryPath=""
        onClose={handleCloseBulkDate}
      />
      <DirectoryBulkLocationModal
        visible={bulkLocationModalVisible}
        photos={selectedPhotos}
        onClose={handleCloseBulkLocation}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    height: "100%",
  },
  breadCrumbsWrapper: {
    flexDirection: "row",
    flex: 1,
    gap: 8,
    alignItems: "center",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  editButton: {
    marginLeft: 4,
    padding: 4,
  },
  selectionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginLeft: 16,
  },
  selectionText: {
    fontSize: 14,
    color: "#333",
  },
  moreButton: {
    padding: 4,
  },
});

export default observer(BreadCrumbs);
