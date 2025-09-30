import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  FlatList,
} from "react-native";
import { FaceController } from "@/services/face";
import Icon from "../Icon";
import { Face } from "@/services/views";
import { useDirectoriesStore } from "@/stores/directories";
import { useApiClient } from "folke-service-helpers";

/**
 * Composant permettant d'afficher et modifier le nom associé à un visage.
 * - Si face.name existe : l'affiche.
 * - Sinon affiche "Visage inconnu".
 * - Un clic sur le nom ouvre un champ d'édition avec autocomplétion des noms connus.
 */
export function FaceSelector({
  face,
  onNameAssigned,
  dense,
}: {
  face: Face; // objet Face (doit contenir id et name)
  onNameAssigned?: (name: string) => void;
  dense?: boolean;
}) {
  const apiClient = useApiClient();
  const directoriesStore = useDirectoriesStore();
  const faceController = useMemo(
    () => new FaceController(apiClient),
    [apiClient]
  );
  const [names, setNames] = useState<string[]>([]);
  const [loadingNames, setLoadingNames] = useState(false);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState<string>(face.name ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestedName, setSuggestedName] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filtrer les noms en fonction de la valeur saisie
  const filteredNames = useMemo(() => {
    if (!value.trim() || !names.length) return [];
    const searchText = value.trim().toLowerCase();
    return names
      .filter((name) => name.toLowerCase().includes(searchText))
      .filter((name) => name !== value) // Exclure la valeur exacte
      .slice(0, 5); // Limiter à 5 suggestions
  }, [value, names]);

  // Charger la liste des noms quand on passe en édition
  useEffect(() => {
    if (!editing) return;
    let cancelled = false;
    setLoadingNames(true);
    async function loadFaceNames() {
      const n = await faceController.getNames(directoriesStore.galleryId);
      if (cancelled) return;
      if (n.ok) setNames(n.value.map((x) => x.name));
      else setNames([]);
      setLoadingNames(false);
    }
    loadFaceNames();
    return () => {
      cancelled = true;
    };
  }, [directoriesStore.galleryId, editing, faceController]);

  const displayLabel = face.name || "Visage inconnu";

  const fetchSuggestion = useCallback(async () => {
    if (face.name) return; // déjà nommé
    setSuggestionLoading(true);
    setSuggestedName(null);
    try {
      const resp = await faceController.suggestName(
        directoriesStore.galleryId,
        face.id,
        { threshold: 0.8 }
      );
      if (resp.ok) {
        setSuggestedName(resp.value.name);
      }
    } finally {
      setSuggestionLoading(false);
    }
  }, [directoriesStore.galleryId, face.id, face.name, faceController]);

  const handleEnterEdit = useCallback(() => {
    setError(null);
    setValue(face.name ?? "");
    setEditing(true);
    setShowSuggestions(false);
    // lancer suggestion si pas de nom
    if (!face.name) {
      fetchSuggestion();
    }
  }, [face.name, fetchSuggestion]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setValue(face.name ?? "");
    setError(null);
    setSuggestedName(null);
    setShowSuggestions(false);
  }, [face.name]);

  const canSubmit = value.trim().length > 0 && value.trim() !== face.name;

  const acceptSuggestion = useCallback(() => {
    if (suggestedName) {
      setValue(suggestedName);
      setShowSuggestions(false);
    }
  }, [suggestedName]);

  const handleSelectName = useCallback((selectedName: string) => {
    setValue(selectedName);
    setShowSuggestions(false);
  }, []);

  const handleTextChange = useCallback((text: string) => {
    setValue(text);
    setShowSuggestions(text.trim().length > 0);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) {
      setEditing(false);
      return;
    }
    setSubmitting(true);
    setError(null);
    setShowSuggestions(false);
    try {
      await faceController.assignName(directoriesStore.galleryId, face.id, {
        name: value.trim(),
      });
      onNameAssigned?.(value.trim());
      setEditing(false);
    } catch (e) {
      if (e instanceof Error) setError(e.message);
      else setError("Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  }, [
    canSubmit,
    directoriesStore.galleryId,
    face.id,
    faceController,
    onNameAssigned,
    value,
  ]);

  if (!editing) {
    return (
      <TouchableOpacity
        onPress={handleEnterEdit}
        style={styles.inlineRow}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.label,
            dense && styles.labelDense,
            !face.name && styles.unknown,
          ]}
        >
          {displayLabel}
        </Text>
        <View style={styles.iconButton}>
          <Icon name="pencil" set="mci" size={16} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.editContainer}>
      <View style={styles.inputCol}>
        <TextInput
          style={styles.input}
          value={value}
          placeholder="Nom"
          onChangeText={handleTextChange}
          onSubmitEditing={handleSubmit}
          onFocus={() => setShowSuggestions(value.trim().length > 0)}
          autoFocus
        />

        {/* Liste d'autocomplétion */}
        {showSuggestions && filteredNames.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={filteredNames}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSelectName(item)}
                >
                  <Text style={styles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              )}
              style={styles.suggestionsList}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        )}

        {!!error && <Text style={styles.error}>{error}</Text>}
        {!error && suggestionLoading && (
          <Text style={styles.helper}>Recherche suggestion...</Text>
        )}
        {!error && !suggestionLoading && suggestedName && (
          <TouchableOpacity onPress={acceptSuggestion}>
            <Text style={styles.suggestion}>
              Suggestion: {suggestedName} (taper pour accepter)
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.actionsRow}>
        {loadingNames && <ActivityIndicator size="small" />}
        {suggestionLoading && !suggestedName && (
          <ActivityIndicator size="small" />
        )}
        {suggestedName && value.trim() !== suggestedName && (
          <TouchableOpacity
            onPress={acceptSuggestion}
            style={styles.iconButton}
          >
            <Icon
              name="lightbulb-on-outline"
              set="mci"
              size={18}
              color="#ffca28"
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          disabled={!canSubmit || submitting}
          onPress={handleSubmit}
          style={[
            styles.iconButton,
            (!canSubmit || submitting) && styles.disabledBtn,
          ]}
        >
          {submitting ? (
            <ActivityIndicator size="small" />
          ) : (
            <Icon name="check" set="mci" size={18} />
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={handleCancel} style={styles.iconButton}>
          <Icon name="close" set="mci" size={18} color="#ff9800" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default FaceSelector;

const styles = StyleSheet.create({
  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minHeight: 24,
  },
  label: { fontSize: 12, color: "#00a0c6", textDecorationLine: "underline" },
  labelDense: { fontSize: 10 },
  unknown: { color: "#888" },
  iconButton: { paddingHorizontal: 6, paddingVertical: 4 },
  iconText: { fontSize: 14 },
  lightbulb: { color: "#ffca28" },
  cancel: { color: "#ff9800" },
  editContainer: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 4,
    borderRadius: 6,
    alignItems: "flex-start",
    gap: 4,
  },
  inputCol: { flex: 1 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 14,
  },
  actionsRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  error: { color: "#d32f2f", fontSize: 11, marginTop: 2 },
  helper: { color: "#666", fontSize: 11, marginTop: 2 },
  suggestion: { color: "#ffca28", fontSize: 11, marginTop: 2 },
  disabledBtn: { opacity: 0.4 },
  suggestionsContainer: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: "white",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ccc",
    marginTop: 2,
  },
  suggestionsList: {
    maxHeight: 150,
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  suggestionText: {
    fontSize: 14,
    color: "#333",
  },
});
