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
import Icon from "./Icon";
import { useDirectoriesStore } from "@/stores/directories";
import { useFaceNamesStore } from "@/stores/face-names";

export interface FaceNameInputProps {
  faceId: number;
  initialName?: string | null;
  autoSuggest?: boolean;
  onAssigned?: (name: string) => void;
  onCancel?: () => void;
  dense?: boolean;
}

export function FaceNameInput({
  faceId,
  initialName,
  autoSuggest = true,
  onAssigned,
  onCancel,
  dense,
}: FaceNameInputProps) {
  const directoriesStore = useDirectoriesStore();
  const faceNamesStore = useFaceNamesStore();
  const names = faceNamesStore.names;
  const [value, setValue] = useState<string>(initialName ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [suggestedName, setSuggestedName] = useState<string | null>(null);
  const [showAutoComplete, setShowAutoComplete] = useState(false);

  // Suggestion automatique si demandé et pas de nom initial
  useEffect(() => {
    if (!autoSuggest || initialName) return;
    let cancelled = false;
    async function fetchSuggestion() {
      setSuggestionLoading(true);
      try {
        const resp = await faceNamesStore.suggestNameForFace(faceId);
        if (!cancelled && resp) setSuggestedName(resp);
      } finally {
        if (!cancelled) setSuggestionLoading(false);
      }
    }
    fetchSuggestion();
    return () => {
      cancelled = true;
    };
  }, [
    autoSuggest,
    initialName,
    directoriesStore.galleryId,
    faceId,
    faceNamesStore,
  ]);

  const filteredNames = useMemo(() => {
    if (!value.trim() || !names) return [];
    const searchText = value.trim().toLowerCase();
    return names
      .filter((name) => name.name.toLowerCase().includes(searchText))
      .filter((name) => name.name !== value)
      .slice(0, 5);
  }, [value, names]);

  const canSubmit = value.trim().length > 0 && value.trim() !== initialName;

  const acceptSuggestion = useCallback(() => {
    if (suggestedName) {
      setValue(suggestedName);
      setShowAutoComplete(false);
    }
  }, [suggestedName]);

  const handleSelectName = useCallback((selected: string) => {
    setValue(selected);
    setShowAutoComplete(false);
  }, []);

  const handleTextChange = useCallback((text: string) => {
    setValue(text);
    setShowAutoComplete(text.trim().length > 0);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    setShowAutoComplete(false);
    await faceNamesStore.assignNameToFace(faceId, value.trim());
    onAssigned?.(value.trim());
    setSubmitting(false);
  }, [canSubmit, faceId, faceNamesStore, onAssigned, value]);

  return (
    <View style={styles.container}>
      <View style={styles.inputCol}>
        <TextInput
          style={[styles.input, dense && styles.inputDense]}
          value={value}
          placeholder="Nom"
          onChangeText={handleTextChange}
          onSubmitEditing={handleSubmit}
          onFocus={() => setShowAutoComplete(value.trim().length > 0)}
          autoFocus
        />
        {showAutoComplete && names === null && (
          <ActivityIndicator size="small" />
        )}
        {showAutoComplete && filteredNames.length > 0 && (
          <View style={styles.autoCompleteContainer}>
            <FlatList
              data={filteredNames}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSelectName(item.name)}
                >
                  <Text style={styles.autoCompleteText}>{item.name}</Text>
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
        {!error &&
          !suggestionLoading &&
          suggestedName &&
          value.trim() !== suggestedName && (
            <TouchableOpacity
              style={styles.suggestionButton}
              onPress={acceptSuggestion}
            >
              <Icon
                name="lightbulb-on-outline"
                set="mci"
                size={18}
                color="#ffca28"
              />
              <Text style={styles.suggestion}>{suggestedName}</Text>
            </TouchableOpacity>
          )}
      </View>
      <View style={styles.actionsRow}>
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
            <Icon name="check" set="mci" size={18} color="green" />
          )}
        </TouchableOpacity>
        {onCancel && (
          <TouchableOpacity onPress={onCancel} style={styles.iconButton}>
            <Icon name="close" set="mci" size={18} color="#ff9800" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  inputDense: { paddingVertical: 4, fontSize: 12 },
  actionsRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  error: { color: "#d32f2f", fontSize: 11, marginTop: 2 },
  helper: { color: "#666", fontSize: 11, marginTop: 2 },
  suggestion: {
    color: "#ffca28",
    fontSize: 11,
    marginTop: 2,
  },
  suggestionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderColor: "#ffca28",
    borderWidth: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  disabledBtn: { opacity: 0.4 },
  autoCompleteContainer: {
    backgroundColor: "white",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ccc",
    marginTop: 2,
  },
  suggestionsList: { maxHeight: 150 },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  autoCompleteText: { fontSize: 14, color: "#333" },
  iconButton: { paddingHorizontal: 6, paddingVertical: 4 },
});

export default FaceNameInput;
