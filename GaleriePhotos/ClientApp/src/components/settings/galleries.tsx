import React, { useState, useEffect, useMemo, useCallback } from "react";
import { observer } from "mobx-react-lite";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useApiClient } from "folke-service-helpers";
import { GalleryController } from "../../services/gallery";
import { UserController } from "../../services/user";
import * as views from "../../services/views";
import { DataProviderType } from "../../services/enums";

const Galleries = observer(function Galleries() {
  const apiClient = useApiClient();
  const galleryController = useMemo(
    () => new GalleryController(apiClient),
    [apiClient]
  );
  const userController = useMemo(
    () => new UserController(apiClient),
    [apiClient]
  );

  const [galleries, setGalleries] = useState<views.Gallery[]>([]);
  const [users, setUsers] = useState<views.User[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    rootDirectory: "",
    thumbnailsDirectory: "",
    userId: "",
    dataProvider: DataProviderType.FileSystem as DataProviderType,
    seafileServerUrl: "",
  });

  const loadData = useMemo(
    () => async () => {
      setLoading(true);
      try {
        const [galleriesResult, usersResult] = await Promise.all([
          galleryController.getAll(),
          userController.getAll(),
        ]);

        if (galleriesResult.ok) {
          setGalleries(galleriesResult.value);
        }
        if (usersResult.ok) {
          setUsers(usersResult.value);
        }
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    },
    [galleryController, userController]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () =>
    setCreateForm({
      name: "",
      rootDirectory: "",
      thumbnailsDirectory: "",
      userId: "",
      dataProvider: DataProviderType.FileSystem,
      seafileServerUrl: "",
    });

  const handleCreateGallery = useCallback(async () => {
    if (!createForm.name || !createForm.userId) return;
    if (
      createForm.dataProvider === DataProviderType.FileSystem &&
      !createForm.rootDirectory
    )
      return;
    if (
      createForm.dataProvider === DataProviderType.Seafile &&
      !createForm.seafileServerUrl
    )
      return;
    setCreating(true);
    setError(null);
    try {
      const result = await galleryController.create({
        name: createForm.name,
        rootDirectory:
          createForm.dataProvider === DataProviderType.FileSystem
            ? createForm.rootDirectory
            : "",
        thumbnailsDirectory:
          createForm.dataProvider === DataProviderType.FileSystem
            ? createForm.thumbnailsDirectory
            : "",
        userId: createForm.userId,
        dataProvider: createForm.dataProvider,
        seafileServerUrl:
          createForm.dataProvider === DataProviderType.Seafile
            ? createForm.seafileServerUrl || null
            : null,
        seafileApiKey: null,
      });
      if (result.ok) {
        await loadData();
        resetForm();
        setCreateOpen(false);
      } else {
        setError(result.message || "Échec de la création");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setCreating(false);
    }
  }, [createForm, galleryController, loadData]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Galeries</Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setCreateOpen(true)}
        >
          <Text style={styles.primaryButtonText}>＋ Nouvelle</Text>
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {galleries.map((g) => (
          <View key={g.id} style={styles.card}>
            <Text style={styles.galleryName}>{g.name}</Text>
            <Text style={styles.smallLabel}>
              Racine: <Text style={styles.mono}>{g.rootDirectory}</Text>
            </Text>
            <Text style={styles.smallLabel}>
              Miniatures:{" "}
              <Text style={styles.mono}>{g.thumbnailsDirectory || "—"}</Text>
            </Text>
            <View style={styles.adminRow}>
              {g.administratorNames.map((a) => (
                <View key={a} style={styles.chip}>
                  <Text style={styles.chipText}>{a}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
        {galleries.length === 0 && (
          <Text style={styles.empty}>Aucune galerie</Text>
        )}
      </ScrollView>

      <Modal
        visible={createOpen}
        animationType="slide"
        onRequestClose={() => setCreateOpen(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Créer une nouvelle galerie</Text>
          <ScrollView>
            <Text style={styles.inputLabel}>Nom *</Text>
            <TextInput
              style={styles.input}
              value={createForm.name}
              onChangeText={(v) => setCreateForm({ ...createForm, name: v })}
              placeholder="Nom de la galerie"
            />
            <Text style={styles.inputLabel}>Type de données *</Text>
            <View style={styles.selectorRow}>
              {[DataProviderType.FileSystem, DataProviderType.Seafile].map(
                (tp) => (
                  <TouchableOpacity
                    key={tp}
                    style={[
                      styles.selectorChip,
                      tp === createForm.dataProvider &&
                        styles.selectorChipActive,
                    ]}
                    onPress={() =>
                      setCreateForm({
                        ...createForm,
                        dataProvider: tp,
                        rootDirectory:
                          tp === DataProviderType.FileSystem
                            ? createForm.rootDirectory
                            : "",
                        thumbnailsDirectory:
                          tp === DataProviderType.FileSystem
                            ? createForm.thumbnailsDirectory
                            : "",
                        seafileServerUrl:
                          tp === DataProviderType.Seafile
                            ? createForm.seafileServerUrl
                            : "",
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.selectorChipText,
                        tp === createForm.dataProvider &&
                          styles.selectorChipTextActive,
                      ]}
                    >
                      {tp === DataProviderType.FileSystem
                        ? "Fichiers"
                        : "Seafile"}
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>
            {createForm.dataProvider === DataProviderType.FileSystem && (
              <>
                <Text style={styles.inputLabel}>Répertoire racine *</Text>
                <TextInput
                  style={styles.input}
                  value={createForm.rootDirectory}
                  onChangeText={(v) =>
                    setCreateForm({ ...createForm, rootDirectory: v })
                  }
                  placeholder="/chemin/racine"
                  autoCapitalize="none"
                />
                <Text style={styles.inputLabel}>Répertoire des miniatures</Text>
                <TextInput
                  style={styles.input}
                  value={createForm.thumbnailsDirectory}
                  onChangeText={(v) =>
                    setCreateForm({ ...createForm, thumbnailsDirectory: v })
                  }
                  placeholder="/chemin/miniatures"
                  autoCapitalize="none"
                />
              </>
            )}
            {createForm.dataProvider === DataProviderType.Seafile && (
              <>
                <Text style={styles.inputLabel}>URL serveur Seafile *</Text>
                <TextInput
                  style={styles.input}
                  value={createForm.seafileServerUrl}
                  onChangeText={(v) =>
                    setCreateForm({ ...createForm, seafileServerUrl: v })
                  }
                  placeholder="https://seafile.example.com"
                  autoCapitalize="none"
                />
              </>
            )}
            <Text style={styles.inputLabel}>Administrateur initial *</Text>
            <View style={styles.selectorRow}>
              {users.map((u) => (
                <TouchableOpacity
                  key={u.id}
                  style={[
                    styles.selectorChipSmall,
                    createForm.userId === u.id && styles.selectorChipActive,
                  ]}
                  onPress={() => setCreateForm({ ...createForm, userId: u.id })}
                >
                  <Text
                    style={[
                      styles.selectorChipTextSmall,
                      createForm.userId === u.id &&
                        styles.selectorChipTextActive,
                    ]}
                  >
                    {u.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  setCreateOpen(false);
                  resetForm();
                }}
              >
                <Text style={styles.secondaryButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (creating ||
                    !createForm.name ||
                    !createForm.userId ||
                    (createForm.dataProvider === DataProviderType.FileSystem &&
                      !createForm.rootDirectory) ||
                    (createForm.dataProvider === DataProviderType.Seafile &&
                      !createForm.seafileServerUrl)) &&
                    styles.disabledButton,
                ]}
                onPress={handleCreateGallery}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Créer</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
});

export default Galleries;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 24, fontWeight: "600" },
  primaryButton: {
    backgroundColor: "#1976d2",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 6,
  },
  primaryButtonText: { color: "#fff", fontWeight: "600" },
  secondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: "#eee",
  },
  secondaryButtonText: { color: "#333", fontWeight: "500" },
  disabledButton: { opacity: 0.5 },
  list: { flex: 1 },
  card: {
    backgroundColor: "#fafafa",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  galleryName: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  smallLabel: { fontSize: 12, color: "#555" },
  mono: { fontFamily: "monospace" },
  adminRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
  chip: {
    backgroundColor: "#e0ecf9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  chipText: { fontSize: 12, color: "#1e6091" },
  empty: { textAlign: "center", marginTop: 40, color: "#777" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 8 },
  modalContainer: { flex: 1, padding: 20, backgroundColor: "#fff" },
  modalTitle: { fontSize: 20, fontWeight: "600", marginBottom: 16 },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
  },
  selectorRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  selectorChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#eee",
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  selectorChipSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#eee",
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectorChipActive: { backgroundColor: "#1976d2" },
  selectorChipText: { color: "#333", fontSize: 14 },
  selectorChipTextSmall: { color: "#333", fontSize: 13 },
  selectorChipTextActive: { color: "#fff" },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 32,
    gap: 12,
  },
  error: { color: "#d32f2f", marginTop: 12 },
});
