import React, { useState, useEffect, useMemo } from "react";
import { observer } from "mobx-react-lite";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useDirectoriesStore } from "@/stores/directories";
import { GalleryController } from "@/services/gallery";
import { useApiClient } from "folke-service-helpers";
import { GallerySettings, GalleryPatch } from "@/services/views";
import { DataProviderType } from "@/services/enums";
import SeafileApiKeyDialog from "@/components/settings/seafile-api-key-dialog"; // sera RN après migration
import SeafileRepositorySelect from "@/components/settings/seafile-repository-select"; // idem

const GallerySettingsView = observer(() => {
  const directoriesStore = useDirectoriesStore();
  const apiClient = useApiClient();
  const galleryController = useMemo(
    () => new GalleryController(apiClient),
    [apiClient]
  );

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [gallery, setGallery] = useState<GallerySettings | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [rootDirectory, setRootDirectory] = useState("");
  const [thumbnailsDirectory, setThumbnailsDirectory] = useState("");
  const [dataProvider, setDataProvider] = useState<DataProviderType>(
    DataProviderType.FileSystem
  );
  const [seafileServerUrl, setSeafileServerUrl] = useState("");
  const [seafileApiKey, setSeafileApiKey] = useState("");
  const [apiKeyDialogOpen, setApiKeyDialogOpen] = useState(false);

  const loadGallery = useMemo(
    () => async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await galleryController.getSettingsById(
          directoriesStore.galleryId
        );
        if (result.ok) {
          setGallery(result.value);
          setName(result.value.name);
          setRootDirectory(result.value.rootDirectory);
          setThumbnailsDirectory(result.value.thumbnailsDirectory || "");
          setDataProvider(result.value.dataProvider);
          setSeafileServerUrl(result.value.seafileServerUrl || "");
          setSeafileApiKey(result.value.seafileApiKey || "");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load gallery");
      } finally {
        setLoading(false);
      }
    },
    [directoriesStore.galleryId, galleryController]
  );

  useEffect(() => {
    if (directoriesStore.galleryId) {
      loadGallery();
    }
  }, [directoriesStore.galleryId, loadGallery]);

  const handleSave = async () => {
    if (!gallery) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const patchData: GalleryPatch = {
        name: name !== gallery.name ? name : null,
        rootDirectory:
          rootDirectory !== gallery.rootDirectory ? rootDirectory : null,
        thumbnailsDirectory:
          thumbnailsDirectory !== (gallery.thumbnailsDirectory || "")
            ? thumbnailsDirectory || null
            : null,
        dataProvider:
          dataProvider !== gallery.dataProvider ? dataProvider : null,
        seafileServerUrl:
          seafileServerUrl !== (gallery.seafileServerUrl || "")
            ? seafileServerUrl || null
            : null,
        seafileApiKey:
          seafileApiKey !== (gallery.seafileApiKey || "")
            ? seafileApiKey || null
            : null,
      };

      // Only send patch if there are actual changes
      if (
        patchData.name !== null ||
        patchData.rootDirectory !== null ||
        patchData.thumbnailsDirectory !== null ||
        patchData.dataProvider !== null ||
        patchData.seafileServerUrl !== null ||
        patchData.seafileApiKey !== null
      ) {
        const result = await galleryController.update(gallery.id, patchData);
        if (result.ok) {
          setGallery(result.value);
          setSuccess(true);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save gallery");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    gallery &&
    (name !== gallery.name ||
      rootDirectory !== gallery.rootDirectory ||
      thumbnailsDirectory !== (gallery.thumbnailsDirectory || "") ||
      dataProvider !== gallery.dataProvider ||
      seafileServerUrl !== (gallery.seafileServerUrl || "") ||
      seafileApiKey !== (gallery.seafileApiKey || ""));

  // Validation: rootDirectory and thumbnailsDirectory must be different when both provided
  const sameDirectoryError =
    !!rootDirectory &&
    !!thumbnailsDirectory &&
    rootDirectory.trim() !== "" &&
    thumbnailsDirectory.trim() !== "" &&
    rootDirectory === thumbnailsDirectory;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Chargement...</Text>
      </View>
    );
  }

  if (!gallery) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Galerie introuvable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <Text style={styles.title}>Paramètres de la galerie</Text>
        {error && <Text style={styles.error}>{error}</Text>}
        {success && (
          <Text style={styles.success}>Galerie mise à jour avec succès</Text>
        )}
        <View style={styles.card}>
          <Text style={styles.label}>Nom *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nom de la galerie"
          />
          <Text style={[styles.label, { marginTop: 16 }]}>
            Type de stockage *
          </Text>
          <View style={styles.selectorRow}>
            {[DataProviderType.FileSystem, DataProviderType.Seafile].map(
              (t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.selectorChip,
                    t === dataProvider && styles.selectorChipActive,
                  ]}
                  onPress={() => setDataProvider(t)}
                >
                  <Text
                    style={[
                      styles.selectorChipText,
                      t === dataProvider && styles.selectorChipTextActive,
                    ]}
                  >
                    {t === DataProviderType.FileSystem ? "Local" : "Seafile"}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>
          {dataProvider === DataProviderType.FileSystem && (
            <>
              <Text style={styles.label}>Répertoire racine *</Text>
              <TextInput
                style={[styles.input, sameDirectoryError && styles.inputError]}
                value={rootDirectory}
                onChangeText={setRootDirectory}
                autoCapitalize="none"
                placeholder="/photos"
              />
              <Text style={styles.hint}>
                {sameDirectoryError
                  ? "Doit être différent du répertoire miniatures"
                  : "Chemin vers le répertoire contenant les photos"}
              </Text>
              <Text style={styles.label}>Répertoire des miniatures</Text>
              <TextInput
                style={[styles.input, sameDirectoryError && styles.inputError]}
                value={thumbnailsDirectory}
                onChangeText={setThumbnailsDirectory}
                autoCapitalize="none"
                placeholder="/thumbnails"
              />
              {sameDirectoryError && (
                <Text style={styles.errorSmall}>
                  Les répertoires doivent être différents
                </Text>
              )}
            </>
          )}
          {dataProvider === DataProviderType.Seafile && (
            <>
              <Text style={styles.label}>URL du serveur Seafile *</Text>
              <TextInput
                style={styles.input}
                value={seafileServerUrl}
                onChangeText={setSeafileServerUrl}
                placeholder="https://cloud.example.com"
                autoCapitalize="none"
              />
              <Text style={styles.label}>Clé API Seafile *</Text>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={seafileApiKey}
                  onChangeText={setSeafileApiKey}
                  placeholder="API Key"
                  secureTextEntry
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[
                    styles.secondaryButton,
                    !seafileServerUrl && styles.disabledButton,
                  ]}
                  disabled={!seafileServerUrl}
                  onPress={() => setApiKeyDialogOpen(true)}
                >
                  <Text style={styles.secondaryButtonText}>Obtenir</Text>
                </TouchableOpacity>
              </View>
              <View style={{ marginTop: 12 }}>
                <SeafileRepositorySelect
                  label="Bibliothèque des photos"
                  value={rootDirectory}
                  onChange={setRootDirectory}
                  apiKey={seafileApiKey}
                  serverUrl={seafileServerUrl}
                  required
                  helperText="Sélectionnez la bibliothèque pour les photos"
                />
              </View>
              <View style={{ marginTop: 12 }}>
                <SeafileRepositorySelect
                  label="Bibliothèque des miniatures"
                  value={thumbnailsDirectory}
                  onChange={setThumbnailsDirectory}
                  apiKey={seafileApiKey}
                  serverUrl={seafileServerUrl}
                  required
                  helperText="Bibliothèque (vide) pour les miniatures"
                />
              </View>
              {sameDirectoryError && (
                <Text style={styles.errorSmall}>
                  Les bibliothèques doivent être différentes
                </Text>
              )}
            </>
          )}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!hasChanges || saving || sameDirectoryError) &&
                  styles.disabledButton,
              ]}
              disabled={!hasChanges || saving || sameDirectoryError}
              onPress={handleSave}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      {/* Modal API Key sera géré dans composant migré, placeholder ici si besoin */}
      <SeafileApiKeyDialog
        open={apiKeyDialogOpen}
        onClose={() => setApiKeyDialogOpen(false)}
        onSave={(k) => setSeafileApiKey(k)}
      />
    </View>
  );
});

export default GallerySettingsView;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 16,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
  },
  label: { fontSize: 14, fontWeight: "500", marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: "#fff",
  },
  inputError: { borderColor: "#e53935" },
  selectorRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  selectorChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 20,
    marginRight: 8,
    marginTop: 8,
  },
  selectorChipActive: { backgroundColor: "#1976d2" },
  selectorChipText: { color: "#333", fontSize: 14 },
  selectorChipTextActive: { color: "#fff" },
  hint: { fontSize: 11, color: "#666", marginTop: 4 },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 24,
  },
  primaryButton: {
    backgroundColor: "#1976d2",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
  },
  primaryButtonText: { color: "#fff", fontWeight: "600" },
  secondaryButton: {
    backgroundColor: "#1976d2",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  secondaryButtonText: { color: "#fff", fontWeight: "600" },
  disabledButton: { opacity: 0.5 },
  error: { color: "#d32f2f", marginHorizontal: 16, marginBottom: 8 },
  success: { color: "#2e7d32", marginHorizontal: 16, marginBottom: 8 },
  errorSmall: { color: "#d32f2f", fontSize: 12, marginTop: 6 },
});
