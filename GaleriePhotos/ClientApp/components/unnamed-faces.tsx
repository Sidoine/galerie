import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  StyleSheet,
} from "react-native";
import { observer } from "mobx-react-lite";
import { Face } from "@/services/views";
import { useApiClient } from "folke-service-helpers";
import { FaceController } from "@/services/face";
import FaceNameInput from "@/components/face-name-input";
import { ZoomedFaceImage } from "@/components/zoomed-face-image";
import { useDirectoriesStore } from "@/stores/directories";
import { useFaceNamesStore } from "@/stores/face-names";
import { useMembersStore } from "@/stores/members";
import FaceThumbnail from "./face-thumbnail";

interface UnnamedFacesProps {
  count?: number;
}

// Liste horizontale de visages sans nom
export const UnnamedFaces = observer(function UnnamedFaces({
  count = 20,
}: UnnamedFacesProps) {
  const { galleryId } = useDirectoriesStore();
  const apiClient = useApiClient();
  const membersStore = useMembersStore();
  const faceNamesStore = useFaceNamesStore();
  const faceController = useMemo(
    () => new FaceController(apiClient),
    [apiClient]
  );
  const [faces, setFaces] = useState<Face[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFace, setSelectedFace] = useState<Face | null>(null);
  const [busyAssign, setBusyAssign] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!galleryId) return;
    try {
      setError(null);
      const resp = await faceController.getUnnamedFacesSample(
        Number(galleryId),
        { count }
      );
      if (resp.ok) setFaces(resp.value);
      else setError("Erreur de chargement");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur de chargement";
      setError(msg);
    }
  }, [faceController, galleryId, count]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAssign = async (face: Face, name: string) => {
    if (busyAssign) return;
    setBusyAssign(true);
    setAssignError(null);
    try {
      const resp = await faceController.assignName(Number(galleryId), face.id, {
        name,
      });
      if (!resp.ok) setAssignError("Erreur assignation");
      else {
        faceNamesStore.clearCache();
        setSelectedFace(null);
        load();
      }
    } catch (e: unknown) {
      setAssignError(e instanceof Error ? e.message : "Erreur assignation");
    } finally {
      setBusyAssign(false);
    }
  };

  if (!membersStore.administrator) return null;
  if (faces && faces.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Visages sans nom</Text>
        <TouchableOpacity onPress={load} style={styles.refreshButton}>
          <Text style={styles.refreshText}>↻</Text>
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.facesRow}>
          {faces?.map((f) => (
            <TouchableOpacity key={f.id} onPress={() => setSelectedFace(f)}>
              <FaceThumbnail galleryId={String(galleryId)} face={f} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <Modal
        visible={!!selectedFace}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedFace(null)}
      >
        {selectedFace && (
          <View style={styles.modalBackdrop}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>Assigner un nom</Text>
              <ZoomedFaceImage face={selectedFace} />
              {assignError && <Text style={styles.error}>{assignError}</Text>}
              <FaceNameInput
                faceId={selectedFace.id}
                initialName={""}
                autoSuggest
                onAssigned={(n) => {
                  handleAssign(selectedFace, n);
                }}
                onCancel={() => setSelectedFace(null)}
              />
              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setSelectedFace(null)}
                disabled={busyAssign}
              >
                <Text style={styles.closeModalText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { paddingVertical: 8, paddingHorizontal: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  title: { fontSize: 16, fontWeight: "600", flex: 1 },
  refreshButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#eee",
  },
  refreshText: { fontSize: 14 },
  error: { color: "#b00020", marginBottom: 4 },
  facesRow: { flexDirection: "row" },

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
  closeModalBtn: {
    marginTop: 4,
    alignSelf: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  closeModalText: { color: "#1976d2", fontWeight: "600" },
});

export default UnnamedFaces;
