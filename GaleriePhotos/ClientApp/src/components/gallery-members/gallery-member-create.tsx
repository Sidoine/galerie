import { observer } from "mobx-react-lite";
import { useMembersStore } from "../../stores/members";
import { useCallback, useMemo, useState } from "react";
import { useUsersStore } from "../../stores/users";
import { User } from "../../services/views";
import { View, Text, TouchableOpacity, Switch, StyleSheet } from "react-native";

function GalleryMemberCreate() {
  const membersStore = useMembersStore();
  const usersStore = useUsersStore();
  const [isAdmin, setIsAdmin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const canSubmit = selectedUser && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await membersStore.addMembership(selectedUser, 0, isAdmin);
      setIsAdmin(false);
    } finally {
      setSubmitting(false);
    }
  };
  const handleSelectUser = useCallback((user: User | null) => {
    setSelectedUser(user);
  }, []);
  const usersThatAreNotMembers = useMemo(
    () =>
      usersStore.users.filter(
        (u) => !membersStore.members.some((m) => m.userId === u.id)
      ),
    [usersStore.users, membersStore.members]
  );
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ajouter une appartenance</Text>
      <View style={styles.rowWrap}>
        <View style={styles.userList}>
          {usersThatAreNotMembers.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={[
                styles.userItem,
                selectedUser?.id === user.id && styles.userItemSelected,
              ]}
              onPress={() => handleSelectUser(user)}
            >
              <Text style={styles.userItemText}>{user.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.switchRow}>
          <Text style={styles.label}>Admin</Text>
          <Switch value={isAdmin} onValueChange={setIsAdmin} />
        </View>
        <TouchableOpacity
          disabled={!canSubmit}
          onPress={handleSubmit as any}
          style={[
            styles.submitButton,
            !canSubmit && styles.submitButtonDisabled,
          ]}
        >
          <Text style={styles.submitText}>
            {submitting ? "Ajout..." : "Ajouter"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default observer(GalleryMemberCreate);

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  title: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignItems: "flex-start",
  },
  userList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    maxWidth: "100%",
  },
  userItem: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#eee",
    borderRadius: 6,
  },
  userItemSelected: { backgroundColor: "#1976d2" },
  userItemText: { color: "#333" },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontSize: 14 },
  submitButton: {
    backgroundColor: "#1976d2",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitText: { color: "white", fontWeight: "600" },
});
