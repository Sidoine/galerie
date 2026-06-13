import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { observer } from "mobx-react-lite";
import { useApiClient } from "folke-service-helpers";
import { MaterialIcons } from "@expo/vector-icons";
import { CollectionController } from "@/services/collection";
import { PhotoCollection } from "@/services/views";
import { useGalleryStore } from "@/stores/gallery";

interface CollectionAddModalProps {
  visible: boolean;
  photoIds: number[];
  onClose: () => void;
}

export const CollectionAddModal = observer(function CollectionAddModal({
  visible,
  photoIds,
  onClose,
}: CollectionAddModalProps) {
  const galleryStore = useGalleryStore();
  const apiClient = useApiClient();
  const collectionService = useMemo(
    () => new CollectionController(apiClient),
    [apiClient],
  );

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [collections, setCollections] = useState<PhotoCollection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<
    number | null
  >(null);

  const [createVisible, setCreateVisible] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");

  const galleryId = galleryStore.galleryId;

  const loadCollections = useCallback(async () => {
    setLoading(true);
    try {
      const response = await collectionService.getCollections(galleryId);
      if (response.ok) {
        setCollections(response.value);
      } else {
        Alert.alert(
          "Erreur",
          response.message ?? "Impossible de charger les collections",
        );
      }
    } catch (error) {
      console.error("Error loading collections:", error);
      Alert.alert("Erreur", "Impossible de charger les collections");
    } finally {
      setLoading(false);
    }
  }, [collectionService, galleryId]);

  useEffect(() => {
    if (!visible) {
      setSelectedCollectionId(null);
      return;
    }
    void loadCollections();
  }, [visible, loadCollections]);

  const handleCreateCollection = useCallback(async () => {
    const name = newCollectionName.trim();
    if (!name) {
      Alert.alert("Erreur", "Veuillez saisir un nom de collection");
      return;
    }

    setSubmitting(true);
    try {
      const response = await collectionService.createCollection(galleryId, {
        name,
      });
      if (!response.ok) {
        Alert.alert(
          "Erreur",
          response.message ?? "Impossible de créer la collection",
        );
        return;
      }

      setCollections((current) =>
        [...current, response.value].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
      setSelectedCollectionId(response.value.id);
      setNewCollectionName("");
      setCreateVisible(false);
    } catch (error) {
      console.error("Error creating collection:", error);
      Alert.alert("Erreur", "Impossible de créer la collection");
    } finally {
      setSubmitting(false);
    }
  }, [collectionService, galleryId, newCollectionName]);

  const handleAddToCollection = useCallback(async () => {
    if (!selectedCollectionId) {
      Alert.alert("Erreur", "Veuillez sélectionner une collection");
      return;
    }

    if (photoIds.length === 0) {
      Alert.alert("Erreur", "Aucune photo sélectionnée");
      return;
    }

    setSubmitting(true);
    try {
      const response = await collectionService.addPhotosToCollection(
        galleryId,
        selectedCollectionId,
        { photoIds },
      );

      if (!response.ok) {
        Alert.alert(
          "Erreur",
          response.message ?? "Impossible d'ajouter les photos",
        );
        return;
      }

      const addedCount = response.value;
      Alert.alert(
        "Succès",
        `${addedCount} photo${addedCount > 1 ? "s" : ""} ajoutée${
          addedCount > 1 ? "s" : ""
        } à la collection`,
      );
      onClose();
    } catch (error) {
      console.error("Error adding photos to collection:", error);
      Alert.alert("Erreur", "Impossible d'ajouter les photos à la collection");
    } finally {
      setSubmitting(false);
    }
  }, [collectionService, galleryId, onClose, photoIds, selectedCollectionId]);

  const renderCollectionItem = ({ item }: { item: PhotoCollection }) => {
    const isSelected = selectedCollectionId === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.collectionItem,
          isSelected && styles.collectionItemSelected,
        ]}
        onPress={() => setSelectedCollectionId(item.id)}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        <View style={styles.collectionContent}>
          <MaterialIcons
            name="collections-bookmark"
            size={22}
            color={isSelected ? "#007aff" : "#666"}
          />
          <View style={styles.collectionTexts}>
            <Text
              style={[
                styles.collectionName,
                isSelected && styles.collectionNameSelected,
              ]}
            >
              {item.name}
            </Text>
            <Text style={styles.collectionCount}>
              {item.photoCount} photo{item.photoCount > 1 ? "s" : ""}
            </Text>
          </View>
        </View>
        {isSelected && <MaterialIcons name="check" size={22} color="#007aff" />}
      </TouchableOpacity>
    );
  };

  return (
    <>
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
              <Text style={styles.title}>Ajouter à une collection</Text>
              <TouchableOpacity onPress={onClose} accessibilityLabel="Fermer">
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.subtitle}>
              {photoIds.length} photo{photoIds.length > 1 ? "s" : ""}{" "}
              sélectionnée
              {photoIds.length > 1 ? "s" : ""}
            </Text>

            <View style={styles.createRow}>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setCreateVisible(true)}
                accessibilityRole="button"
              >
                <MaterialIcons name="add" size={18} color="#007aff" />
                <Text style={styles.createButtonText}>Nouvelle collection</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007aff" />
                <Text style={styles.loadingText}>
                  Chargement des collections...
                </Text>
              </View>
            ) : collections.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Aucune collection. Créez-en une pour commencer.
                </Text>
              </View>
            ) : (
              <FlatList
                data={collections}
                renderItem={renderCollectionItem}
                keyExtractor={(item) => item.id.toString()}
                style={styles.collectionList}
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
                  styles.confirmButton,
                  (submitting || selectedCollectionId === null) &&
                    styles.confirmButtonDisabled,
                ]}
                onPress={handleAddToCollection}
                disabled={submitting || selectedCollectionId === null}
                accessibilityRole="button"
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Ajouter</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={createVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateVisible(false)}
      >
        <Pressable
          style={styles.popupOverlay}
          onPress={() => setCreateVisible(false)}
        >
          <Pressable
            style={styles.popupContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.popupTitle}>Nouvelle collection</Text>
            <TextInput
              style={styles.input}
              value={newCollectionName}
              onChangeText={setNewCollectionName}
              placeholder="Nom de la collection"
              placeholderTextColor="#999"
              maxLength={100}
              autoFocus
            />
            <View style={styles.popupActions}>
              <TouchableOpacity
                style={styles.popupCancelButton}
                onPress={() => {
                  setCreateVisible(false);
                  setNewCollectionName("");
                }}
                accessibilityRole="button"
              >
                <Text style={styles.popupCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.popupConfirmButton,
                  (submitting || !newCollectionName.trim()) &&
                    styles.popupConfirmDisabled,
                ]}
                onPress={handleCreateCollection}
                disabled={submitting || !newCollectionName.trim()}
                accessibilityRole="button"
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.popupConfirmText}>Créer</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
    maxHeight: "85%",
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
    paddingBottom: 12,
  },
  createRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "#eef5ff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  createButtonText: {
    color: "#007aff",
    fontWeight: "600",
  },
  collectionList: {
    maxHeight: 360,
  },
  collectionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  collectionItemSelected: {
    backgroundColor: "#f0f8ff",
  },
  collectionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  collectionTexts: {
    flex: 1,
  },
  collectionName: {
    fontSize: 16,
    color: "#222",
  },
  collectionNameSelected: {
    color: "#007aff",
    fontWeight: "600",
  },
  collectionCount: {
    marginTop: 2,
    fontSize: 12,
    color: "#777",
  },
  loadingContainer: {
    padding: 36,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
  },
  emptyContainer: {
    padding: 36,
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    textAlign: "center",
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
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: "#007aff",
    alignItems: "center",
  },
  confirmButtonDisabled: {
    backgroundColor: "#ccc",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  popupOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  popupContent: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  popupTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#222",
  },
  popupActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 14,
  },
  popupCancelButton: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    paddingVertical: 12,
  },
  popupCancelText: {
    fontWeight: "600",
    color: "#666",
  },
  popupConfirmButton: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: "#007aff",
    alignItems: "center",
    paddingVertical: 12,
  },
  popupConfirmDisabled: {
    backgroundColor: "#ccc",
  },
  popupConfirmText: {
    fontWeight: "600",
    color: "#fff",
  },
});
