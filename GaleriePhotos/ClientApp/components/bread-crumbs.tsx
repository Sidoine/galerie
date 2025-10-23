import { PhotoContainerStore } from "@/stores/photo-container";
import { Link } from "expo-router";
import { observer } from "mobx-react-lite";
import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { EditNameModal } from "@/components/modals/edit-name-modal";

function BreadCrumbs({ store }: { store: PhotoContainerStore }) {
  const [editModalVisible, setEditModalVisible] = useState(false);
  
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

  if (!store.breadCrumbs) return <Text>Galerie photo</Text>;
  
  const lastCrumb = store.breadCrumbs[store.breadCrumbs.length - 1];
  const currentName = lastCrumb?.name || "";
  
  return (
    <>
      <View style={styles.container}>
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
      {store.renameContainer && (
        <EditNameModal
          visible={editModalVisible}
          currentName={currentName}
          onClose={handleCloseEditModal}
          onSave={handleSaveName}
        />
      )}
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
    height: "100%",
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
});

export default observer(BreadCrumbs);
