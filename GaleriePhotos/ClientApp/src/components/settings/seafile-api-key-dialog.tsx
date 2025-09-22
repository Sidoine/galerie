import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  StyleSheet,
} from "react-native";
import { useDirectoriesStore } from "../../stores/directories";
import { useApiClient } from "folke-service-helpers";
import { GalleryController } from "../../services/gallery";

function SeafileApiKeyDialog({
  onClose,
  onSave,
  open,
}: {
  onClose: () => void;
  onSave: (apiKey: string) => void;
  open: boolean;
}) {
  const apiClient = useApiClient();

  const { galleryId } = useDirectoriesStore();
  const [seafileUsername, setSeafileUsername] = useState("");
  const [seafilePassword, setSeafilePassword] = useState("");
  const [fetchingApiKey, setFetchingApiKey] = useState(false);
  const [fetchApiKeyError, setFetchApiKeyError] = useState<string | null>(null);

  const handleClick = useCallback(async () => {
    setFetchingApiKey(true);
    setFetchApiKeyError(null);
    const service = new GalleryController(apiClient);
    const response = await service.getSeafileApiKey(galleryId, {
      username: seafileUsername,
      password: seafilePassword,
    });
    if (response.ok) {
      onSave(response.value.apiKey);
      onClose();
      setSeafilePassword("");
    } else {
      setFetchApiKeyError("Échec: " + response.message);
    }
    setFetchingApiKey(false);
  }, [apiClient, galleryId, onClose, onSave, seafilePassword, seafileUsername]);

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modal}>
          <Text style={styles.title}>Obtenir une clé API Seafile</Text>
          {fetchApiKeyError && (
            <Text style={styles.error}>{fetchApiKeyError}</Text>
          )}
          <Text style={styles.label}>Nom d'utilisateur</Text>
          <TextInput
            style={styles.input}
            value={seafileUsername}
            onChangeText={setSeafileUsername}
            autoCapitalize="none"
            autoFocus
          />
          <Text style={styles.label}>Mot de passe</Text>
          <TextInput
            style={styles.input}
            value={seafilePassword}
            onChangeText={setSeafilePassword}
            secureTextEntry
            autoCapitalize="none"
          />
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onClose}
              disabled={fetchingApiKey}
            >
              <Text style={styles.secondaryButtonText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (fetchingApiKey || !seafileUsername || !seafilePassword) &&
                  styles.disabled,
              ]}
              disabled={fetchingApiKey || !seafileUsername || !seafilePassword}
              onPress={handleClick}
            >
              {fetchingApiKey ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Obtenir</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default SeafileApiKeyDialog;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  title: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
  label: { fontSize: 14, fontWeight: "500", marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 24,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: "#1976d2",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  primaryButtonText: { color: "#fff", fontWeight: "600" },
  secondaryButton: {
    backgroundColor: "#eee",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  secondaryButtonText: { color: "#333", fontWeight: "500" },
  disabled: { opacity: 0.5 },
  error: { color: "#d32f2f" },
});
