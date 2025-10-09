import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  createContext,
  useContext,
} from "react";
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
import { usePhotosStore } from "@/stores/photos";
import { useMembersStore } from "@/stores/members";

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
  const membersStore = useMembersStore();
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
  const [previewFace, setPreviewFace] = useState<Face | null>(null);
  const [rejectError, setRejectError] = useState<string | null>(null);

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
  const assignContextValue = useMemo(
    () => ({
      assign: async (face: Face, name: string) => {
        const response = await faceController.assignName(
          Number(galleryId),
          face.id,
          { name }
        );
        return response.ok;
      },
    }),
    [faceController, galleryId]
  );

  if (!faceName) return null;
  if (faces && faces.length === 0) return null;
  if (!membersStore.administrator) return null;

  return (
    <AssignFaceContext.Provider value={assignContextValue}>
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
                selected={selectedFaceId === f.id}
                onPress={() => {
                  setSelectedFaceId((prev) => {
                    // si déjà sélectionné => ouvrir la modale
                    if (prev === f.id) {
                      setPreviewFace(f);
                      return prev; // conserve sélection
                    }
                    // sinon on sélectionne simplement
                    return f.id;
                  });
                }}
                onAssigned={() => {
                  setSelectedFaceId(null);
                  setPreviewFace(null);
                  load();
                }}
                onReject={() => {
                  setRejectFace(f);
                  setSelectedFaceId(null);
                  setPreviewFace(null);
                }}
              />
            ))}
          </View>
        </ScrollView>
        {/* Modale d'aperçu de la photo contenant le visage */}
        <Modal
          visible={!!previewFace}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setPreviewFace(null);
            setSelectedFaceId(null);
          }}
        >
          {previewFace && (
            <FacePhotoPreview
              face={previewFace}
              faceName={faceName?.name || ""}
              onClose={() => {
                setPreviewFace(null);
                setSelectedFaceId(null);
              }}
              onAssigned={() => {
                setPreviewFace(null);
                setSelectedFaceId(null);
                load();
              }}
              onReject={() => {
                setRejectFace(previewFace);
                setPreviewFace(null);
                setSelectedFaceId(null);
              }}
            />
          )}
        </Modal>
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
    </AssignFaceContext.Provider>
  );
});

// Contexte d'assignation de visage
interface AssignFaceContextValue {
  assign: (face: Face, name: string) => Promise<boolean>;
}
const AssignFaceContext = createContext<AssignFaceContextValue | null>(null);
function useAssignFace() {
  const ctx = useContext(AssignFaceContext);
  if (!ctx) throw new Error("AssignFaceContext non fourni");
  return ctx;
}

function SuggestedFaceThumbnail({
  face,
  galleryId,
  selected,
  onPress,
  onAssigned,
  onReject,
}: {
  face: Face;
  galleryId: number;
  selected: boolean;
  onPress: () => void; // ouvre la modale de preview
  onAssigned: () => void;
  onReject: () => void;
}) {
  // Contrôleur non nécessaire ici depuis le refactor
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const assignCtx = useAssignFace();
  const faceThumbnailUrl = `/api/gallery/${galleryId}/faces/${face.id}/thumbnail`;
  // L'assignation se fait désormais dans la modale d'aperçu

  return (
    <TouchableOpacity onPress={onPress}>
      <View
        style={[styles.faceWrapper, selected && styles.faceWrapperSelected]}
      >
        <Image source={{ uri: faceThumbnailUrl }} style={styles.faceImage} />
        {selected && (
          <View style={styles.overlay}>
            <TouchableOpacity
              accessibilityLabel="Assigner ce visage"
              style={[styles.actionButton, styles.okButton]}
              onPress={async () => {
                if (assigning) return;
                setAssignError(null);
                setAssigning(true);
                try {
                  const ok = await assignCtx.assign(face, ""); // le nom sera injecté via faceName prop future si besoin
                  if (!ok) setAssignError("Erreur assignation");
                  else onAssigned();
                } catch (e: unknown) {
                  setAssignError(
                    e instanceof Error ? e.message : "Erreur assignation"
                  );
                } finally {
                  setAssigning(false);
                }
              }}
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

const FacePhotoPreview = observer(function FacePhotoPreview({
  face,
  faceName,
  onClose,
  onAssigned,
  onReject,
}: {
  face: Face;
  faceName: string;
  onClose: () => void;
  onAssigned: () => void;
  onReject: () => void;
}) {
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const assignCtx = useAssignFace();
  const faceNamesStore = useFaceNamesStore();
  const photoStore = usePhotosStore();
  const photo = photoStore.imageLoader.getValue(face.photoId);

  // Construction d'URL de la photo (grand format) via l'ID public nécessiterait d'abord de charger la photo.
  // On réutilise l'endpoint de miniature pour l'instant si nécessaire.
  // Hypothèse: endpoint image: /api/photos/{photoId}/image accepte l'id numérique (sinon adaptation future en chargeant PhotoFull)
  useEffect(() => {
    // tentative directe (si backend accepte l'id numérique); sinon il faudra récupérer le publicId via PhotoController.get(face.photoId)
    const directUrl = photo?.publicId
      ? photoStore.getImage(photo.publicId)
      : null;
    setPhotoUrl(directUrl);
    setLoading(false);
  }, [face.photoId, photo?.publicId, photoStore]);

  const handleAssign = async () => {
    if (assigning) return;
    setAssigning(true);
    setAssignError(null);
    try {
      const ok = await assignCtx.assign(face, faceName);
      if (!ok) setAssignError("Erreur assignation");
      else {
        faceNamesStore.clearCache();
        onAssigned();
      }
    } catch (e: unknown) {
      setAssignError(e instanceof Error ? e.message : "Erreur assignation");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <View style={styles.modalBackdrop}>
      <View style={[styles.modal, styles.previewModal]}>
        <Text style={styles.modalTitle}>Visage</Text>
        <View style={styles.previewImageContainer}>
          {loading && <Text>Chargement...</Text>}
          {!loading && photoUrl && (
            <Image
              source={{ uri: photoUrl }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}
        </View>
        {assignError && <Text style={styles.error}>{assignError}</Text>}
        <View style={styles.previewActionsRow}>
          <TouchableOpacity
            style={[styles.actionButtonLarge, styles.okButton]}
            onPress={handleAssign}
            disabled={assigning}
          >
            <Text style={styles.actionButtonLargeText}>Assigner</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButtonLarge, styles.rejectButton]}
            onPress={onReject}
            disabled={assigning}
          >
            <Text style={styles.actionButtonLargeText}>Rejeter</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.closeModalBtn}
          onPress={onClose}
          disabled={assigning}
        >
          <Text style={styles.closeModalText}>Fermer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

const RejectFaceModal = observer(function RejectFaceModal({
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
  const photosStore = usePhotosStore();
  const photo = photosStore.imageLoader.getValue(face.photoId);
  const [rejectPhotoUrl, setRejectPhotoUrl] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(true);

  useEffect(() => {
    if (photo?.publicId) {
      setRejectPhotoUrl(photosStore.getImage(photo.publicId));
      setPhotoLoading(false);
    }
  }, [photo?.publicId, photosStore, face.photoId]);

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
        <View
          style={[
            styles.previewImageContainer,
            { aspectRatio: 1, marginBottom: 16 },
          ]}
        >
          {photoLoading && <Text>Chargement...</Text>}
          {!photoLoading && rejectPhotoUrl && (
            <Image
              source={{ uri: rejectPhotoUrl }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}
        </View>
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
});

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
  faceWrapperSelected: {
    width: 84,
    height: 84,
    borderRadius: 42,
    marginTop: -6,
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
  previewModal: {
    width: 360,
    maxWidth: "100%",
  },
  previewImageContainer: {
    width: "100%",
    aspectRatio: 1,
    marginBottom: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
    borderRadius: 8,
    overflow: "hidden",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewActionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  actionButtonLarge: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: "center",
    marginHorizontal: 4,
  },
  actionButtonLargeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default SuggestedFaces;
