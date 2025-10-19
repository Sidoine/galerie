import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Icon from "../Icon";
import { Face } from "@/services/views";
import FaceNameInput from "../face-name-input";

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
  const [editing, setEditing] = useState(false);

  const displayLabel = face.name || "Visage inconnu";

  const handleEnterEdit = useCallback(() => {
    setEditing(true);
  }, []);

  const handleNameAssigned = useCallback(
    (selectedName: string) => {
      setEditing(false);
      onNameAssigned?.(selectedName);
    },
    [onNameAssigned]
  );

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
          <Icon name="pencil" set="mci" size={16} color="#fff" />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <FaceNameInput
      faceId={face.id}
      initialName={face.name}
      onAssigned={handleNameAssigned}
      onCancel={() => setEditing(false)}
    />
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
