import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { observer } from "mobx-react-lite";
import { useMeStore } from "@/stores/me";
import { useAuthenticationStore } from "@/stores/authentication";
import { useRouter } from "expo-router";

const AccountScreen = observer(function AccountScreen() {
  const meStore = useMeStore();
  const authStore = useAuthenticationStore();
  const user = meStore.me;
  const router = useRouter();
  const initial = user?.name?.[0]?.toUpperCase() || "U";

  const handleLogout = useCallback(async () => {
    await authStore.logout();
  }, [authStore]);

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Aucun utilisateur connecté</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.profileSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.userName}>{user.name}</Text>
      </View>

      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={styles.actionItem}
          onPress={() => router.push("/privacy")}
        >
          <Text style={styles.actionText}>Politique de confidentialité</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionItem, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default AccountScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#1976d2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "600",
  },
  userName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 32,
  },
  actionsSection: {
    flex: 1,
    paddingTop: 32,
  },
  actionItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#f5f5f5",
  },
  actionText: {
    fontSize: 16,
    color: "#1976d2",
    fontWeight: "500",
    textAlign: "center",
  },
  logoutButton: {
    backgroundColor: "#d32f2f",
    marginTop: 24,
  },
  logoutText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
  },
});