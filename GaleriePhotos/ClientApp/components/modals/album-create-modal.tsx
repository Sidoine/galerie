import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { observer } from "mobx-react-lite";
import { useApiClient } from "folke-service-helpers";
import { DirectoryController } from "@/services/directory";
import { DirectoryCreate } from "@/services/views";
import { useSelectedPhotosStore } from "@/stores/selected-photos";
import { MaterialIcons } from "@expo/vector-icons";
import { useGalleryStore } from "@/stores/gallery";

interface AlbumCreateModalProps {
  visible: boolean;
  photoIds: number[];
  onClose: () => void;
  onSuccess?: () => void;
}

export const AlbumCreateModal = observer(function AlbumCreateModal({
  visible,
  photoIds,
  onClose,
  onSuccess,
}: AlbumCreateModalProps) {
  const galleryStore = useGalleryStore();
  const [albumName, setAlbumName] = useState("");
  const [loading, setLoading] = useState(false);
  const apiClient = useApiClient();
  const directoryService = useMemo(
    () => new DirectoryController(apiClient),
    [apiClient]
  );
  const selectedPhotosStore = useSelectedPhotosStore();
  const galleryId = galleryStore.gallery?.id;

  const handleCreate = useCallback(async () => {
    if (!albumName.trim()) {
      Alert.alert("Erreur", "Veuillez saisir un nom pour l'album");
      return;
    }

    if (!galleryId) {
      Alert.alert("Erreur", "Aucune galerie sélectionnée");
      return;
    }

    if (photoIds.length === 0) {
      Alert.alert("Erreur", "Aucune photo sélectionnée");
      return;
    }

    try {
      setLoading(true);
      const createData: DirectoryCreate = {
        name: albumName.trim(),
        photoIds,
      };

      const response = await directoryService.createDirectory(
        galleryId,
        createData
      );

      if (response.ok) {
        Alert.alert(
          "Succès",
          `Album "${albumName.trim()}" créé avec ${photoIds.length} photo${
            photoIds.length > 1 ? "s" : ""
          }`
        );
        selectedPhotosStore.clearSelection();
        setAlbumName("");
        onSuccess?.();
        onClose();
      } else {
        const errorMessage =
          typeof response.error === "string"
            ? response.error
            : "Une erreur est survenue lors de la création de l'album";
        Alert.alert("Erreur", errorMessage);
      }
    } catch (error) {
      console.error("Error creating album:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la création");
    } finally {
      setLoading(false);
    }
  }, [
    albumName,
    galleryId,
    onClose,
    onSuccess,
    photoIds,
    selectedPhotosStore,
    directoryService,
  ]);

  const handleClose = useCallback(() => {
    setAlbumName("");
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable
          style={styles.modalContent}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Créer un nouvel album</Text>
            <TouchableOpacity
              onPress={handleClose}
              accessibilityLabel="Fermer"
            >
              <MaterialIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            {photoIds.length} photo{photoIds.length > 1 ? "s" : ""} sera
            {photoIds.length > 1 ? "ont" : ""} déplacée
            {photoIds.length > 1 ? "s" : ""} dans le nouvel album
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Nom de l'album</Text>
            <TextInput
              style={styles.input}
              value={albumName}
              onChangeText={setAlbumName}
              placeholder="Ex: Vacances été 2024"
              placeholderTextColor="#999"
              autoFocus
              maxLength={100}
            />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              accessibilityRole="button"
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.createButton,
                (loading || !albumName.trim()) && styles.createButtonDisabled,
              ]}
              onPress={handleCreate}
              disabled={loading || !albumName.trim()}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.createButtonText}>Créer</Text>
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
  inputContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#222",
    backgroundColor: "#fff",
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
  createButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#007aff",
    alignItems: "center",
  },
  createButtonDisabled: {
    backgroundColor: "#ccc",
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
