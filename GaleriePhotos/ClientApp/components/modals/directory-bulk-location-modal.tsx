import React, { useState } from "react";
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
import { GeocodingController } from "@/services/geocoding";
import { DirectoryBulkUpdateLocation, AddressGeocodeRequest } from "@/services/views";

interface DirectoryBulkLocationModalProps {
  visible: boolean;
  directoryId: number;
  onClose: () => void;
}

export const DirectoryBulkLocationModal = observer(function DirectoryBulkLocationModal({
  visible,
  directoryId,
  onClose,
}: DirectoryBulkLocationModalProps) {
  const [address, setAddress] = useState("");
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  const [formattedAddress, setFormattedAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const apiClient = useApiClient();

  const handleGeocode = async () => {
    if (!address.trim()) {
      Alert.alert("Erreur", "Veuillez saisir une adresse");
      return;
    }

    try {
      setGeocoding(true);
      const geocodingService = new GeocodingController(apiClient);
      const geocodeRequest: AddressGeocodeRequest = { address: address.trim() };
      
      const response = await geocodingService.geocodeAddress(geocodeRequest);
      
      if (response.ok && response.value) {
        const data = response.value;
        if (data.success && data.latitude !== null && data.longitude !== null) {
          setCoordinates({ latitude: data.latitude, longitude: data.longitude });
          setFormattedAddress(data.formattedAddress || address);
        } else {
          Alert.alert("Erreur", data.error || "Impossible de géolocaliser cette adresse");
        }
      } else {
        Alert.alert("Erreur", "Impossible de géolocaliser cette adresse");
      }
    } catch (error) {
      console.error("Error geocoding address:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la géolocalisation");
    } finally {
      setGeocoding(false);
    }
  };

  const handleSave = async () => {
    if (!coordinates) {
      Alert.alert("Erreur", "Veuillez d'abord géolocaliser l'adresse");
      return;
    }

    try {
      setLoading(true);
      const directoryService = new DirectoryController(apiClient);
      const updateData: DirectoryBulkUpdateLocation = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      };

      const response = await directoryService.bulkUpdateLocation(directoryId, updateData);
      
      if (response.ok) {
        Alert.alert("Succès", "La localisation de toutes les photos a été mise à jour");
        onClose();
        // Reset form
        setAddress("");
        setCoordinates(null);
        setFormattedAddress("");
      } else {
        Alert.alert("Erreur", "Impossible de mettre à jour la localisation");
      }
    } catch (error) {
      console.error("Error updating location:", error);
      Alert.alert("Erreur", "Une erreur est survenue lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setAddress("");
    setCoordinates(null);
    setFormattedAddress("");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.modalBackdrop} onPress={handleClose}>
        <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>
            Modifier la localisation de toutes les photos
          </Text>
          
          <Text style={styles.modalText}>
            Saisissez une adresse pour géolocaliser toutes les photos de cet album.
          </Text>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Adresse :</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Ex: Paris, France"
              placeholderTextColor="#999"
              multiline
            />
            
            <TouchableOpacity
              style={[styles.geocodeButton, geocoding && styles.disabledButton]}
              onPress={handleGeocode}
              disabled={geocoding}
            >
              <Text style={styles.geocodeButtonText}>
                {geocoding ? "Géolocalisation..." : "Géolocaliser"}
              </Text>
            </TouchableOpacity>
          </View>

          {coordinates && (
            <View style={styles.resultSection}>
              <Text style={styles.resultLabel}>Adresse trouvée :</Text>
              <Text style={styles.resultAddress}>{formattedAddress}</Text>
              <Text style={styles.resultCoords}>
                Latitude: {coordinates.latitude.toFixed(6)}, 
                Longitude: {coordinates.longitude.toFixed(6)}
              </Text>
            </View>
          )}

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                (loading || !coordinates) && styles.disabledButton,
              ]}
              onPress={handleSave}
              disabled={loading || !coordinates}
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
  inputSection: {
    marginBottom: 16,
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
    marginBottom: 12,
    minHeight: 50,
  },
  geocodeButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  geocodeButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  resultSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f0f8ff",
    borderRadius: 6,
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    color: "#444",
  },
  resultAddress: {
    fontSize: 14,
    marginBottom: 4,
    color: "#333",
  },
  resultCoords: {
    fontSize: 12,
    color: "#666",
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