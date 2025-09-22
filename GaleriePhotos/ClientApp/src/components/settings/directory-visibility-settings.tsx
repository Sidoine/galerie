import React, { useState, useCallback, useMemo } from "react";
import { observer } from "mobx-react-lite";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert as RNAlert,
} from "react-native";
import { useDirectoryVisibilitiesStore } from "../../stores/directory-visibilities";
import Icon from "../Icon";
import {
  GalleryDirectoryVisibility,
  GalleryDirectoryVisibilityCreate,
  GalleryDirectoryVisibilityPatch,
} from "../../services/views";
import { theme } from "../../theme";

const DirectoryVisibilitySettings = observer(() => {
  const store = useDirectoryVisibilitiesStore();
  const [editDialog, setEditDialog] = useState<{
    visibility?: GalleryDirectoryVisibility;
    open: boolean;
  }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{
    visibility?: GalleryDirectoryVisibility;
    open: boolean;
  }>({ open: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visibilities = store.visibilities;

  const handleCreate = useCallback(() => setEditDialog({ open: true }), []);
  const handleEdit = useCallback(
    (visibility: GalleryDirectoryVisibility) =>
      setEditDialog({ visibility, open: true }),
    []
  );
  const handleDelete = useCallback(
    (visibility: GalleryDirectoryVisibility) =>
      setDeleteDialog({ visibility, open: true }),
    []
  );

  const handleSubmit = useCallback(
    async (
      data: GalleryDirectoryVisibilityCreate | GalleryDirectoryVisibilityPatch
    ) => {
      setLoading(true);
      setError(null);
      try {
        if (editDialog.visibility) {
          await store.updateVisibility(
            editDialog.visibility.id,
            data as GalleryDirectoryVisibilityPatch
          );
        } else {
          await store.createVisibility(
            data as GalleryDirectoryVisibilityCreate
          );
        }
        setEditDialog({ open: false });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur");
      } finally {
        setLoading(false);
      }
    },
    [store, editDialog.visibility]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteDialog.visibility) return;
    setLoading(true);
    setError(null);
    try {
      await store.deleteVisibility(deleteDialog.visibility.id);
      setDeleteDialog({ open: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [store, deleteDialog.visibility]);

  if (!visibilities.length && !loading) {
    store.visibilitiesLoader.getValue(store.galleryId);
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Directory Visibility Settings</Text>
        <TouchableOpacity
          onPress={handleCreate}
          accessibilityRole="button"
          style={[styles.button, styles.primaryButton, styles.addButton]}
          disabled={loading}
        >
          <Icon name="plus" set="mci" size={18} />
          <Text style={[styles.buttonText, styles.addButtonText]}>Ajouter</Text>
        </TouchableOpacity>
      </View>
      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {visibilities.map((v) => (
          <View key={v.id} style={styles.row}>
            <View style={styles.rowMain}>
              <Text style={styles.name}>{v.name}</Text>
              <Text style={styles.iconPreview}>
                {stripHtml(v.icon) || "(icon)"}
              </Text>
              <Text style={styles.value}>{v.value}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => handleEdit(v)}
                style={[styles.smallButton, styles.editButton]}
                accessibilityLabel="Modifier"
              >
                <Icon name="pencil" set="mci" size={16} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleDelete(v)}
                style={[styles.smallButton, styles.deleteButton]}
                accessibilityLabel="Supprimer"
              >
                <Icon name="trash-can-outline" set="mci" size={16} />
              </TouchableOpacity>
            </View>
          </View>
        ))}
        {!visibilities.length && (
          <View style={styles.empty}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.emptyText}>No visibility settings found</Text>
            )}
          </View>
        )}
      </ScrollView>

      <EditVisibilityModal
        open={editDialog.open}
        visibility={editDialog.visibility}
        visibilities={visibilities}
        onClose={() => setEditDialog({ open: false })}
        onSubmit={handleSubmit}
        loading={loading}
      />

      <DeleteConfirmModal
        open={deleteDialog.open}
        visibility={deleteDialog.visibility}
        onClose={() => setDeleteDialog({ open: false })}
        onConfirm={handleConfirmDelete}
        loading={loading}
      />
    </View>
  );
});

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, "").trim();
}

interface EditVisibilityModalProps {
  open: boolean;
  visibility?: GalleryDirectoryVisibility;
  visibilities: GalleryDirectoryVisibility[];
  onClose: () => void;
  onSubmit: (
    data: GalleryDirectoryVisibilityCreate | GalleryDirectoryVisibilityPatch
  ) => void;
  loading: boolean;
}

const EditVisibilityModal = ({
  open,
  visibility,
  visibilities,
  onClose,
  onSubmit,
  loading,
}: EditVisibilityModalProps) => {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const [value, setValue] = useState(1);
  const powerValues = useMemo(() => [1, 2, 4, 8, 16, 32, 64, 128, 256], []);

  React.useEffect(() => {
    if (visibility) {
      setName(visibility.name);
      setIcon(visibility.icon);
      setValue(visibility.value);
    } else {
      setName("");
      setIcon("");
      setValue(1);
    }
  }, [visibility, open]);

  const usedValues = useMemo(
    () =>
      visibilities
        .filter((v) => !visibility || v.id !== visibility.id)
        .map((v) => v.value),
    [visibilities, visibility]
  );
  const valueAlreadyUsed = usedValues.includes(value);

  const disabled = loading || !name || !icon || valueAlreadyUsed;

  const handleSubmit = useCallback(() => {
    if (disabled) return;
    onSubmit({ name, icon, value });
  }, [disabled, onSubmit, name, icon, value]);

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {visibility ? "Edit Visibility" : "Create Visibility"}
          </Text>
          <ScrollView style={{ maxHeight: 400 }}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                style={styles.input}
                placeholder="Name"
                editable={!loading}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Icon (HTML)</Text>
              <TextInput
                value={icon}
                onChangeText={setIcon}
                style={[styles.input, styles.multiline]}
                placeholder="<span>★</span>"
                multiline
                numberOfLines={3}
                editable={!loading}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Value (Power of 2)</Text>
              <View style={styles.tagContainer}>
                {powerValues.map((v) => {
                  const taken = usedValues.includes(v);
                  const selected = v === value;
                  return (
                    <TouchableOpacity
                      key={v}
                      style={[
                        styles.tag,
                        selected && styles.tagSelected,
                        taken && styles.tagDisabled,
                      ]}
                      disabled={taken || loading}
                      onPress={() => setValue(v)}
                    >
                      <Text style={styles.tagText}>{v}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {valueAlreadyUsed && (
                <Text style={styles.errorSmall}>Value already used</Text>
              )}
            </View>
            {icon ? (
              <View style={styles.previewBox}>
                <Text style={styles.previewLabel}>Preview (raw text):</Text>
                <Text style={styles.previewValue}>{stripHtml(icon)}</Text>
              </View>
            ) : null}
          </ScrollView>
          <View style={styles.modalActions}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.button, styles.secondaryButton]}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSubmit}
              style={[
                styles.button,
                styles.primaryButton,
                disabled && styles.buttonDisabled,
              ]}
              disabled={disabled}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {visibility ? "Update" : "Create"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

interface DeleteConfirmModalProps {
  open: boolean;
  visibility?: GalleryDirectoryVisibility;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

const DeleteConfirmModal = ({
  open,
  visibility,
  onClose,
  onConfirm,
  loading,
}: DeleteConfirmModalProps) => {
  const handleConfirm = useCallback(() => {
    if (!loading) onConfirm();
  }, [onConfirm, loading]);
  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.confirmCard}>
          <Text style={styles.modalTitle}>Confirm Delete</Text>
          <Text style={styles.confirmText}>
            Delete visibility "{visibility?.name}" ?
          </Text>
          <View style={styles.modalActions}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.button, styles.secondaryButton]}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleConfirm}
              style={[styles.button, styles.deleteButton]}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DirectoryVisibilitySettings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing(4),
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    ...theme.typography.title,
    color: theme.palette.textPrimary,
  },
  list: {
    flex: 1,
  },
  row: {
    backgroundColor: theme.palette.surfaceElevated,
    padding: theme.spacing(3),
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing(2),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    color: theme.palette.textPrimary,
    fontSize: 16,
    flex: 1,
  },
  iconPreview: {
    color: theme.palette.textSecondary,
    width: 60,
    textAlign: "center",
  },
  value: {
    color: theme.palette.textPrimary,
    width: 50,
    textAlign: "right",
  },
  actions: {
    flexDirection: "row",
    marginLeft: 8,
  },
  smallButton: {
    paddingHorizontal: theme.spacing(2.5),
    paddingVertical: theme.spacing(1.5),
    marginLeft: theme.spacing(1.5),
    borderRadius: theme.radius.sm,
    backgroundColor: theme.palette.surfaceAlt,
  },
  smallButtonText: {
    color: "#fff",
    fontSize: 14,
  },
  editButton: {
    backgroundColor: "#444",
  },
  deleteButton: {
    backgroundColor: theme.palette.danger,
  },
  empty: {
    padding: theme.spacing(10),
    alignItems: "center",
  },
  emptyText: {
    color: theme.palette.textMuted,
  },
  button: {
    paddingHorizontal: theme.spacing(4),
    paddingVertical: theme.spacing(2.5),
    borderRadius: theme.radius.md,
  },
  primaryButton: {
    backgroundColor: theme.palette.primary,
  },
  secondaryButton: {
    backgroundColor: "#555",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: theme.palette.textPrimary,
    fontWeight: "600",
    fontSize: 14,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  addButtonText: {
    marginLeft: 6,
  },
  errorBox: {
    backgroundColor: "#5a0000",
    padding: theme.spacing(2),
    borderRadius: theme.radius.sm,
    marginBottom: theme.spacing(2),
  },
  errorText: {
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: theme.spacing(5),
  },
  modalCard: {
    backgroundColor: theme.palette.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing(4),
  },
  confirmCard: {
    backgroundColor: theme.palette.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing(4),
  },
  modalTitle: {
    color: theme.palette.textPrimary,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: theme.spacing(3),
  },
  formGroup: {
    marginBottom: theme.spacing(3),
  },
  label: {
    color: theme.palette.textSecondary,
    marginBottom: theme.spacing(1),
    fontSize: 13,
  },
  input: {
    backgroundColor: theme.palette.surfaceAlt,
    color: theme.palette.textPrimary,
    paddingHorizontal: theme.spacing(2.5),
    paddingVertical: theme.spacing(2),
    borderRadius: theme.radius.sm,
  },
  multiline: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingHorizontal: theme.spacing(2.5),
    paddingVertical: theme.spacing(1.5),
    borderRadius: theme.radius.sm,
    backgroundColor: "#444",
    marginRight: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  tagSelected: {
    backgroundColor: theme.palette.primary,
  },
  tagDisabled: {
    backgroundColor: "#222",
    opacity: 0.4,
  },
  tagText: {
    color: "#fff",
    fontSize: 12,
  },
  previewBox: {
    backgroundColor: theme.palette.surfaceAlt,
    padding: theme.spacing(2.5),
    borderRadius: theme.radius.md,
  },
  previewLabel: {
    color: "#bbb",
    marginBottom: 4,
    fontSize: 12,
  },
  previewValue: {
    color: "#fff",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: theme.spacing(4),
    gap: 12,
  },
  confirmText: {
    color: "#ddd",
    fontSize: 14,
  },
  errorSmall: {
    color: "#ff8080",
    fontSize: 11,
    marginTop: 4,
  },
});
