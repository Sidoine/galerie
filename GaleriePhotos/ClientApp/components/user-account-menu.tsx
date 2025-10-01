import React, { useState, useCallback } from "react";
import { observer } from "mobx-react-lite";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { useMeStore } from "@/stores/me";

// Version React Native du menu utilisateur
const UserAccountMenu = observer(function UserAccountMenu() {
  const meStore = useMeStore();
  const user = meStore.me;
  const [open, setOpen] = useState(false);
  const initial = user?.name?.[0]?.toUpperCase() || "U";

  const handleLogout = useCallback(() => {
    // Fallback web: simple redirection si backend Identity disponible
    if (typeof window !== "undefined") {
      window.location.href = "/Identity/Account/Logout";
    }
    setOpen(false);
  }, []);

  if (!user) return null;

  return (
    <View>
      <TouchableOpacity
        style={styles.avatarButton}
        onPress={() => setOpen(true)}
      >
        <Text style={styles.avatarText}>{initial}</Text>
      </TouchableOpacity>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.panel}>
            <Text style={styles.name}>{user.name}</Text>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleLogout}
            >
              <Text style={styles.actionText}>Se déconnecter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeLink}
              onPress={() => setOpen(false)}
            >
              <Text style={styles.closeText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
});

export default UserAccountMenu;

const styles = StyleSheet.create({
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1976d2",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "600" },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  panel: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 320,
    alignItems: "center",
  },
  name: { fontSize: 18, fontWeight: "600" },
  email: { fontSize: 13, color: "#555", marginTop: 4 },
  actionButton: {
    marginTop: 24,
    backgroundColor: "#d32f2f",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionText: { color: "#fff", fontWeight: "600" },
  closeLink: { marginTop: 16 },
  closeText: { color: "#1976d2", fontWeight: "500" },
});
