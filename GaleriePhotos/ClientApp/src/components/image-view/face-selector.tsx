import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { FaceController } from "../../services/face";
import Icon from "../Icon";
import { Face } from "../../services/views";
import { useMyApiClient } from "../../stores/api-client";
import { useDirectoriesStore } from "../../stores/directories";

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
    }, [face.name]);

  const canSubmit = value.trim().length > 0 && value.trim() !== face.name;

  const acceptSuggestion = useCallback(() => {
    if (suggestedName) {
      setValue(suggestedName);
    }
  }, [suggestedName]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) {
      setEditing(false);
      return;
    }
    setSubmitting(true);
    setError(null);
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
      <View style={styles.inlineRow}>
        <TouchableOpacity onPress={handleEnterEdit}>
          <Text
            style={[
              styles.label,
              dense && styles.labelDense,
              !face.name && styles.unknown,
            ]}
          >
            {displayLabel}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleEnterEdit} style={styles.iconButton}>
          <Icon name="pencil" set="mci" size={16} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.editContainer}>
      <View style={styles.inputCol}>
        <TextInput
          style={styles.input}
          value={value}
          placeholder="Nom"
          onChangeText={setValue}
          onSubmitEditing={handleSubmit}
          autoFocus
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
        {!error && suggestionLoading && (
          <Text style={styles.helper}>Recherche suggestion...</Text>
        )}
        {!error && !suggestionLoading && suggestedName && (
          <TouchableOpacity onPress={acceptSuggestion}>
            <Text style={styles.suggestion}>
              Suggestion: {suggestedName} (
              {(suggestedSimilarity ?? 0).toFixed(2)}) (taper pour accepter)
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
  inlineRow: { flexDirection: "row", alignItems: "center", gap: 4 },
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
});
