import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Face } from "@/services/views";
import FaceNameInput from "@/components/face-name-input";
import { useApiClient } from "folke-service-helpers";
import { FaceController } from "@/services/face";
import { useLocalSearchParams } from "expo-router";
import { useFaceNamesStore } from "@/stores/face-names";
import { observer } from "mobx-react-lite";

interface SuggestedFacesProps {
  max?: number;
}

// Affiche une liste horizontale de visages suggérés pour le nom courant
export const SuggestedFaces = observer(function SuggestedFaces({
  max = 10,
}: SuggestedFacesProps) {
  const { faceNameId, galleryId } = useLocalSearchParams<{
    faceNameId: string;
    galleryId: string;
  }>();
  const faceNamesStore = useFaceNamesStore();
  const apiClient = useApiClient();
  const faceController = useMemo(
    () => new FaceController(apiClient),
    [apiClient]
  );
  const [faces, setFaces] = useState<Face[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFaceId, setSelectedFaceId] = useState<number | null>(null);
  const [rejectFace, setRejectFace] = useState<Face | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);
  // router n'est plus nécessaire tant que les miniatures ne naviguent pas
  // const router = useRouter();
  // const { getPhotoLink } = usePhotoContainer(); // plus utilisé pour la navigation directe sur la miniature

  const faceName = faceNameId
    ? faceNamesStore.getName(Number(faceNameId))
    : null;

  const load = useCallback(async () => {
    if (!faceName || !galleryId) return;
    try {
      setError(null);
      const response = await faceController.getSimilarFaces(Number(galleryId), {
        name: faceName.name,
        limit: max,
      });
      if (response.ok) setFaces(response.value);
      else setError("Erreur de chargement");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erreur de chargement";
      setError(message);
    }
  }, [faceController, faceName, galleryId, max]);

  useEffect(() => {
    load();
  }, [load]);

  if (!faceName) return null;
  if (faces && faces.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Visages suggérés</Text>
        <TouchableOpacity onPress={load} style={styles.refreshButton}>
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.facesRow}>
          {faces?.map((f) => (
            <SuggestedFaceThumbnail
              key={f.id}
              face={f}
              galleryId={Number(galleryId)}
              faceName={faceName?.name || ""}
              selected={selectedFaceId === f.id}
              onToggle={() =>
                setSelectedFaceId((prev) => (prev === f.id ? null : f.id))
              }
              onAssigned={() => {
                setSelectedFaceId(null);
                load();
              }}
              onReject={() => {
                setRejectFace(f);
                setSelectedFaceId(null);
              }}
            />
          ))}
        </View>
      </ScrollView>
      <Modal
        visible={!!rejectFace}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectFace(null)}
      >
        {rejectFace && (
          <RejectFaceModal
            face={rejectFace}
            galleryId={Number(galleryId)}
            onClose={() => {
              setRejectFace(null);
              setRejectError(null);
            }}
            onDeleted={() => {
              setRejectFace(null);
              load();
            }}
            onRenamed={() => {
              setRejectFace(null);
              load();
            }}
          />
        )}
      </Modal>
      {rejectError && <Text style={styles.error}>{rejectError}</Text>}
    </View>
  );
});

function SuggestedFaceThumbnail({
  face,
  galleryId,
  faceName,
  selected,
  onToggle,
  onAssigned,
  onReject,
}: {
  face: Face;
  galleryId: number;
  faceName: string;
  selected: boolean;
  onToggle: () => void;
  onAssigned: () => void;
  onReject: () => void;
}) {
  const apiClient = useApiClient();
  const faceController = useMemo(
    () => new FaceController(apiClient),
    [apiClient]
  );
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const faceThumbnailUrl = `/api/gallery/${galleryId}/faces/${face.id}/thumbnail`;
  const faceNamesStore = useFaceNamesStore();

  const handleAssign = async () => {
    if (assigning) return;
    setAssignError(null);
    setAssigning(true);
    try {
      const response = await faceController.assignName(galleryId, face.id, {
        name: faceName,
      });
      if (!response.ok) {
        setAssignError("Erreur assignation");
      } else {
        onAssigned();
        faceNamesStore.clearCache();
      }
    } catch (e: unknown) {
      setAssignError(e instanceof Error ? e.message : "Erreur assignation");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <TouchableOpacity onPress={onToggle}>
      <View style={styles.faceWrapper}>
        <Image source={{ uri: faceThumbnailUrl }} style={styles.faceImage} />
        {selected && (
          <View style={styles.overlay}>
            <TouchableOpacity
              accessibilityLabel="Assigner ce visage"
              style={[styles.actionButton, styles.okButton]}
              onPress={handleAssign}
              disabled={assigning}
            >
              <Text style={styles.actionText}>✓</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Rejeter ce visage"
              style={[styles.actionButton, styles.rejectButton]}
              onPress={onReject}
              disabled={assigning}
            >
              <Text style={styles.actionText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        {assignError && <Text style={styles.errorBadge}>{assignError}</Text>}
      </View>
    </TouchableOpacity>
  );
}

function RejectFaceModal({
  face,
  galleryId,
  onClose,
  onDeleted,
  onRenamed,
}: {
  face: Face;
  galleryId: number;
  onClose: () => void;
  onDeleted: () => void;
  onRenamed: () => void;
}) {
  const apiClient = useApiClient();
  const faceController = useMemo(
    () => new FaceController(apiClient),
    [apiClient]
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const resp = await faceController.deleteFace(galleryId, face.id);
      if (!resp.ok) setError("Suppression impossible");
      else onDeleted();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Suppression impossible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.modalBackdrop}>
      <View style={styles.modal}>
        <Text style={styles.modalTitle}>Rejeter le visage</Text>
        <View style={styles.modalSection}>
          <Text style={styles.sectionHeader}>Associer à un autre nom</Text>
          <FaceNameInput
            faceId={face.id}
            initialName={face.name}
            autoSuggest
            onAssigned={() => onRenamed()}
            onCancel={onClose}
          />
        </View>
        <View style={styles.modalSection}>
          <Text style={styles.sectionHeader}>Ou supprimer ce visage</Text>
          <TouchableOpacity
            style={[styles.deleteButton, busy && styles.disabledBtn]}
            disabled={busy}
            onPress={handleDelete}
          >
            <Text style={styles.deleteButtonText}>Supprimer le visage</Text>
          </TouchableOpacity>
        </View>
        {error && <Text style={styles.error}>{error}</Text>}
        <TouchableOpacity
          style={styles.closeModalBtn}
          onPress={onClose}
          disabled={busy}
        >
          <Text style={styles.closeModalText}>Fermer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  refreshButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#eee",
  },
  refreshText: {
    fontSize: 14,
  },
  error: {
    color: "#b00020",
    marginBottom: 4,
  },
  facesRow: {
    flexDirection: "row",
  },
  faceWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: "hidden",
    marginRight: 8,
    backgroundColor: "#f0f0f0",
    position: "relative",
  },
  faceImage: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.45)",
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  okButton: {
    backgroundColor: "#2e7d32",
  },
  rejectButton: {
    backgroundColor: "#c62828",
  },
  actionText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    lineHeight: 16,
  },
  errorBadge: {
    position: "absolute",
    bottom: -18,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 10,
    color: "#c62828",
  },
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
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  modalText: { fontSize: 14, marginBottom: 12, color: "#444" },
  modalSection: { marginBottom: 16 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    color: "#222",
  },
  deleteButton: {
    backgroundColor: "#c62828",
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  deleteButtonText: { color: "#fff", fontWeight: "600" },
  closeModalBtn: {
    marginTop: 4,
    alignSelf: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  closeModalText: { color: "#1976d2", fontWeight: "600" },
  disabledBtn: { opacity: 0.4 },
});

export default SuggestedFaces;
