import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { observer } from "mobx-react-lite";
import { useApiClient } from "folke-service-helpers";
import { PhotoController } from "@/services/photo";
import { DirectoryController } from "@/services/directory";
import { PhotoMove, Directory } from "@/services/views";
import { useSelectedPhotosStore } from "@/stores/selected-photos";
import { MaterialIcons } from "@expo/vector-icons";

interface PhotoMoveModalProps {
  visible: boolean;
  photoIds: number[];
  rootDirectoryId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PhotoMoveModal = observer(function PhotoMoveModal({
  visible,
  photoIds,
  rootDirectoryId,
  onClose,
  onSuccess,
}: PhotoMoveModalProps) {
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [selectedDirectoryId, setSelectedDirectoryId] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [loadingDirectories, setLoadingDirectories] = useState(false);
  const apiClient = useApiClient();
  const selectedPhotosStore = useSelectedPhotosStore();

  useEffect(() => {
    if (visible && rootDirectoryId) {
      loadDirectories();
    } else {
      setDirectories([]);
      setSelectedDirectoryId(null);
    }
  }, [visible, rootDirectoryId, loadDirectories]);

  const loadDirectories = useCallback(async () => {
    try {
      setLoadingDirectories(true);
      const directoryService = new DirectoryController(apiClient);
      const response = await directoryService.getSubdirectories(
        rootDirectoryId
      );

      if (response.ok && response.value) {
        setDirectories(response.value);
      } else {
        Alert.alert("Erreur", "Impossible de charger les albums");
      }
    } catch (error) {
      console.error("Error loading directories:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors du chargement");
    } finally {
      setLoadingDirectories(false);
    }
  }, [apiClient, rootDirectoryId]);

  const handleMove = async () => {
    if (selectedDirectoryId === null) {
      Alert.alert("Erreur", "Veuillez sélectionner un album de destination");
      return;
    }

    if (photoIds.length === 0) {
      Alert.alert("Erreur", "Aucune photo sélectionnée");
      return;
    }

    try {
      setLoading(true);
      const photoService = new PhotoController(apiClient);
      const moveData: PhotoMove = {
        photoIds,
        targetDirectoryId: selectedDirectoryId,
      };

      const response = await photoService.movePhotos(moveData);

      if (response.ok) {
        Alert.alert(
          "Succès",
          `${photoIds.length} photo${photoIds.length > 1 ? "s" : ""} déplacée${photoIds.length > 1 ? "s" : ""} avec succès`
        );
        selectedPhotosStore.clearSelection();
        onSuccess?.();
        onClose();
      } else {
        Alert.alert(
          "Erreur",
          "Une erreur est survenue lors du déplacement des photos"
        );
      }
    } catch (error) {
      console.error("Error moving photos:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors du déplacement");
    } finally {
      setLoading(false);
    }
  };

  const renderDirectoryItem = ({ item }: { item: Directory }) => {
    const isSelected = selectedDirectoryId === item.id;
    return (
      <TouchableOpacity
        style={[styles.directoryItem, isSelected && styles.directoryItemSelected]}
        onPress={() => setSelectedDirectoryId(item.id)}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        <View style={styles.directoryItemContent}>
          <MaterialIcons
            name="folder"
            size={24}
            color={isSelected ? "#007aff" : "#666"}
          />
          <Text style={[styles.directoryName, isSelected && styles.directoryNameSelected]}>
            {item.path.split("/").pop() || item.path}
          </Text>
        </View>
        {isSelected && (
          <MaterialIcons name="check" size={24} color="#007aff" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={styles.modalContent}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Déplacer vers un album</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Fermer">
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            {photoIds.length} photo{photoIds.length > 1 ? "s" : ""} sélectionnée{photoIds.length > 1 ? "s" : ""}
          </Text>

          {loadingDirectories ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007aff" />
              <Text style={styles.loadingText}>Chargement des albums...</Text>
            </View>
          ) : directories.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucun album disponible</Text>
            </View>
          ) : (
            <FlatList
              data={directories}
              renderItem={renderDirectoryItem}
              keyExtractor={(item) => item.id.toString()}
              style={styles.directoryList}
            />
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              accessibilityRole="button"
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.moveButton,
                (loading || selectedDirectoryId === null) &&
                  styles.moveButtonDisabled,
              ]}
              onPress={handleMove}
              disabled={loading || selectedDirectoryId === null}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.moveButtonText}>Déplacer</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: "80%",
    paddingTop: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#222",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#666",
  },
  directoryList: {
    maxHeight: 400,
  },
  directoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  directoryItemSelected: {
    backgroundColor: "#f0f8ff",
  },
  directoryItemContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  directoryName: {
    fontSize: 16,
    color: "#222",
  },
  directoryNameSelected: {
    color: "#007aff",
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  moveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#007aff",
    alignItems: "center",
  },
  moveButtonDisabled: {
    backgroundColor: "#ccc",
  },
  moveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
