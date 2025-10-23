import { PhotoContainerStore } from "@/stores/photo-container";
import { Link } from "expo-router";
import { observer } from "mobx-react-lite";
import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { EditNameModal } from "@/components/modals/edit-name-modal";
import { useSelectedPhotosStore } from "@/stores/selected-photos";
import { ActionMenu, ActionMenuItem } from "@/components/action-menu";
import { DirectoryBulkDateModal } from "@/components/modals/directory-bulk-date-modal";
import { DirectoryBulkLocationModal } from "@/components/modals/directory-bulk-location-modal";

function BreadCrumbs({ store }: { store: PhotoContainerStore }) {
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectionMenuVisible, setSelectionMenuVisible] = useState(false);
  const [bulkDateModalVisible, setBulkDateModalVisible] = useState(false);
  const [bulkLocationModalVisible, setBulkLocationModalVisible] = useState(false);
  const selectedPhotosStore = useSelectedPhotosStore();
  
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

  const handleClearSelection = useCallback(() => {
    selectedPhotosStore.clearSelection();
  }, [selectedPhotosStore]);

  if (!store.breadCrumbs) return <Text>Galerie photo</Text>;
  
  const lastCrumb = store.breadCrumbs[store.breadCrumbs.length - 1];
  const currentName = lastCrumb?.name || "";
  const hasSelection = selectedPhotosStore.count > 0;

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
      <View style={styles.container}>
        <View style={styles.breadcrumbsRow}>
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
        {hasSelection && (
          <TouchableOpacity
            onPress={handleOpenSelectionMenu}
            style={styles.selectionMenuButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Options pour les photos sélectionnées"
          >
            <Text style={styles.selectionCount}>{selectedPhotosStore.count}</Text>
            <MaterialIcons name="more-vert" size={24} color="#007aff" />
          </TouchableOpacity>
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
        photoIds={selectedPhotosStore.photoIds}
        directoryPath={currentName}
        onClose={handleCloseBulkDateModal}
      />
      <DirectoryBulkLocationModal
        visible={bulkLocationModalVisible}
        photos={selectedPhotosStore.photos}
        onClose={handleCloseBulkLocationModal}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    flexDirection: "row",
    flex: 1,
    gap: 8,
    alignItems: "center",
    justifyContent: "space-between",
    height: "100%",
  },
  breadcrumbsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
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
  selectionMenuButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
    marginLeft: 8,
  },
  selectionCount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007aff",
  },
});

export default observer(BreadCrumbs);
