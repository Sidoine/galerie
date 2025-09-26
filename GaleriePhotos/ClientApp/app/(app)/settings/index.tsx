import React, { useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Switch } from "react-native";
import { observer } from "mobx-react-lite";
import { User } from "../../../services/views";
import { useUsersStore } from "../../../stores/users";

const UserRow = observer(({ user }: { user: User }) => {
  const usersStore = useUsersStore();
  const handleToggleCheck = useCallback(
    (checked: boolean) => {
      usersStore.patch(user, { administrator: checked });
    },
    [usersStore, user]
  );

  return (
    <View style={styles.userRow}>
      <View style={styles.userInfo}>
        <Text style={styles.userEmail}>{user.name}</Text>
      </View>
      <View style={styles.adminSwitch}>
        <Text style={styles.switchLabel}>Admin</Text>
        <Switch value={user.administrator} onValueChange={handleToggleCheck} />
      </View>
    </View>
  );
});

const Users = observer(() => {
  const usersStore = useUsersStore();

  if (!usersStore.users) {
    // if (!usersStore.usersLoader.loading) {
    //     usersStore.usersLoader.load();
    // }
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={usersStore.users}
        keyExtractor={(user) => user.id.toString()}
        renderItem={({ item }) => <UserRow user={item} />}
      />
    </View>
  );
});

export default Users;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  adminSwitch: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchLabel: {
    fontSize: 14,
    marginRight: 8,
  },
  loadingText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 32,
  },
});
