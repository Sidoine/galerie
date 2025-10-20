import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
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
  acceptAllButton: {
    marginRight: 8,
    backgroundColor: "#1976d2",
  },
  acceptAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
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
  previewModal: {
    width: 360,
    maxWidth: "100%",
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
