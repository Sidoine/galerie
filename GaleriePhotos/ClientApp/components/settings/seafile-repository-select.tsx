import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useApiClient } from "folke-service-helpers";
import { GalleryController } from "@/services/gallery";

interface Props {
  label: string;
  value: string;
  onChange: (id: string) => void;
  apiKey: string;
  serverUrl: string;
  helperText?: string;
  required?: boolean;
}

export function SeafileRepositorySelect({
  label,
  value,
  onChange,
  apiKey,
  serverUrl,
  helperText,
  required,
}: Props) {
  const apiClient = useApiClient();
  const galleryController = useMemo(
    () => new GalleryController(apiClient),
    [apiClient]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<
    {
      id: string;
      name: string;
      permission: string;
      encrypted: boolean;
      owner: string;
      size: number;
    }[]
  >([]);

  const load = useCallback(async () => {
    if (!apiKey || !serverUrl) return;
    setLoading(true);
    setError(null);
    const response = await galleryController.getSeafileRepositories({
      apiKey,
      serverUrl,
    });
    if (response.ok) {
      setRepositories(response.value.repositories);
    } else {
      setError(response.message || "Erreur lors du chargement");
    }
    setLoading(false);
  }, [apiKey, serverUrl, galleryController]);

  useEffect(() => {
    load();
  }, [load]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const handleSelect = (id: string) => {
    onChange(id);
    setPickerOpen(false);
  };

  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={styles.label}>
        {label}
        {required ? " *" : ""}
      </Text>
      <TouchableOpacity
        style={[styles.selector, (!apiKey || !serverUrl) && styles.disabled]}
        disabled={!apiKey || !serverUrl || loading || !!error}
        onPress={() => setPickerOpen(true)}
      >
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text
            style={value ? styles.selectorValue : styles.selectorPlaceholder}
          >
            {value
              ? repositories.find((r) => r.id === value)?.name || value
              : "Sélectionner..."}
          </Text>
        )}
      </TouchableOpacity>
      <View style={{ flexDirection: "row", marginTop: 8, gap: 12 }}>
        <TouchableOpacity
          style={[
            styles.smallButton,
            (loading || !apiKey || !serverUrl) && styles.disabled,
          ]}
          disabled={loading || !apiKey || !serverUrl}
          onPress={load}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.smallButtonText}>Rafraîchir</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.smallButtonOutline,
            (!apiKey || !serverUrl) && styles.disabled,
          ]}
          disabled={!apiKey || !serverUrl}
          onPress={() => setPickerOpen(true)}
        >
          <Text style={styles.smallButtonOutlineText}>Choisir</Text>
        </TouchableOpacity>
      </View>
      {helperText && <Text style={styles.helper}>{helperText}</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
      {!error &&
        !loading &&
        repositories.length === 0 &&
        apiKey &&
        serverUrl && (
          <Text style={styles.helper}>Aucun repository disponible.</Text>
        )}
      <Modal
        visible={pickerOpen}
        animationType="slide"
        onRequestClose={() => setPickerOpen(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{label}</Text>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {repositories.map((r) => (
              <TouchableOpacity
                key={r.id}
                style={styles.repoRow}
                onPress={() => handleSelect(r.id)}
              >
                <Text style={styles.repoName}>{r.name}</Text>
                <Text style={styles.repoId}>{r.id}</Text>
                <Text style={styles.repoMeta}>
                  {r.permission}
                  {r.encrypted ? " · 🔒" : ""}
                </Text>
              </TouchableOpacity>
            ))}
            {repositories.length === 0 && (
              <Text style={styles.helper}>Liste vide</Text>
            )}
          </ScrollView>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setPickerOpen(false)}
          >
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

export default SeafileRepositorySelect;

const styles = StyleSheet.create({
  label: { fontSize: 14, fontWeight: "500", marginBottom: 4 },
  selector: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  selectorPlaceholder: { color: "#777" },
  selectorValue: { color: "#222" },
  disabled: { opacity: 0.5 },
  helper: { fontSize: 11, color: "#666", marginTop: 6 },
  error: { fontSize: 12, color: "#d32f2f", marginTop: 6 },
  smallButton: {
    backgroundColor: "#1976d2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  smallButtonText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  smallButtonOutline: {
    borderColor: "#1976d2",
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  smallButtonOutlineText: { color: "#1976d2", fontWeight: "600", fontSize: 12 },
  modalContainer: { flex: 1, backgroundColor: "#fff", padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: "600", marginBottom: 16 },
  repoRow: { paddingVertical: 12, borderBottomWidth: 1, borderColor: "#eee" },
  repoName: { fontSize: 16, fontWeight: "600" },
  repoId: { fontSize: 11, color: "#555", marginTop: 2 },
  repoMeta: { fontSize: 11, color: "#777", marginTop: 2 },
  closeButton: {
    marginTop: 16,
    backgroundColor: "#1976d2",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: { color: "#fff", fontWeight: "600" },
});
