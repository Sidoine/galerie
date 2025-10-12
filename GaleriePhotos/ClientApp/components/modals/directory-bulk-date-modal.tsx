import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import { observer } from "mobx-react-lite";
import { useApiClient } from "folke-service-helpers";
import { DirectoryController } from "@/services/directory";
import { DirectoryBulkUpdateDate } from "@/services/views";

interface DirectoryBulkDateModalProps {
  visible: boolean;
  directoryId: number;
  directoryPath: string;
  onClose: () => void;
}

export const DirectoryBulkDateModal = observer(function DirectoryBulkDateModal({
  visible,
  directoryId,
  directoryPath,
  onClose,
}: DirectoryBulkDateModalProps) {
  const [dateString, setDateString] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestedDate, setSuggestedDate] = useState<string | null>(null);
  const apiClient = useApiClient();

  useEffect(() => {
    if (visible) {
      // Fetch suggested date when modal opens
      const directoryService = new DirectoryController(apiClient);
      directoryService
        .getSuggestedDate(directoryId)
        .then((response) => {
          if (response.ok && response.value?.suggestedDate) {
            const date = new Date(response.value.suggestedDate);
            const formatted = date.toISOString().split("T")[0]; // YYYY-MM-DD format
            setSuggestedDate(formatted);
            setDateString(formatted);
          }
        })
        .catch((error) => {
          console.error("Error fetching suggested date:", error);
        });
    } else {
      // Reset when modal closes
      setDateString("");
      setSuggestedDate(null);
    }
  }, [visible, directoryId, apiClient]);

  const handleSave = async () => {
    if (!dateString.trim()) {
      Alert.alert("Erreur", "Veuillez saisir une date");
      return;
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        Alert.alert("Erreur", "Format de date invalide");
        return;
      }

      setLoading(true);
      const directoryService = new DirectoryController(apiClient);
      const updateData: DirectoryBulkUpdateDate = {
        dateTime: date.toISOString(),
      };

      const response = await directoryService.bulkUpdateDate(directoryId, updateData);
      
      if (response.ok) {
        Alert.alert("Succès", "Les dates de toutes les photos ont été mises à jour");
        onClose();
      } else {
        Alert.alert("Erreur", "Impossible de mettre à jour les dates");
      }
    } catch (error) {
      console.error("Error updating dates:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const useSuggestedDate = () => {
    if (suggestedDate) {
      setDateString(suggestedDate);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>
            Modifier la date de toutes les photos
          </Text>
          
          <Text style={styles.modalText}>
            Album : {directoryPath.split("/").pop()}
          </Text>

          {suggestedDate && (
            <View style={styles.suggestionSection}>
              <Text style={styles.suggestionLabel}>
                Date suggérée basée sur le nom du répertoire :
              </Text>
              <TouchableOpacity
                style={styles.suggestionButton}
                onPress={useSuggestedDate}
              >
                <Text style={styles.suggestionButtonText}>{suggestedDate}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Date (AAAA-MM-JJ) :</Text>
            <TextInput
              style={styles.input}
              value={dateString}
              onChangeText={setDateString}
              placeholder="2023-12-25"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.saveButton, loading && styles.disabledButton]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Sauvegarde..." : "Sauvegarder"}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: 320,
    maxWidth: "100%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  modalText: {
    fontSize: 14,
    marginBottom: 16,
    color: "#666",
  },
  suggestionSection: {
    marginBottom: 16,
  },
  suggestionLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: "#444",
  },
  suggestionButton: {
    backgroundColor: "#f0f8ff",
    borderWidth: 1,
    borderColor: "#007aff",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  suggestionButtonText: {
    color: "#007aff",
    fontSize: 16,
    textAlign: "center",
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: "#444",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: "#007aff",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.5,
  },
});