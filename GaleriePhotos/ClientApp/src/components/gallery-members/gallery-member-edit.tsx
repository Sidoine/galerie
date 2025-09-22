import { observer } from "mobx-react-lite";
import { useMembersStore } from "../../stores/members";
import { useDirectoryVisibilitiesStore } from "../../stores/directory-visibilities";
import { GalleryMember } from "../../services/views";
import React from "react";
import { View, Text, Switch, StyleSheet } from "react-native";

function GalleryMemberEdit({ selectedUser }: { selectedUser: GalleryMember }) {
  const membersStore = useMembersStore();
  const visibilitiesStore = useDirectoryVisibilitiesStore();
  const visibilityOptions = visibilitiesStore.visibilities;

  return (
    <View style={styles.row}>
      <Text style={styles.name}>{selectedUser.userName}</Text>
      <View style={styles.adminSwitch}>
        <Text style={styles.label}>Admin</Text>
        <Switch
          value={selectedUser.isAdministrator}
          onValueChange={(val) =>
            membersStore.setMembershipAdmin(selectedUser, val)
          }
        />
      </View>
      <View style={styles.visibilityArea}>
        {visibilityOptions.map((option) => {
          const checked = (selectedUser.directoryVisibility & option.value) > 0;
          return (
            <View key={option.id} style={styles.visibilityItem}>
              <Switch
                value={checked}
                onValueChange={(val) =>
                  membersStore.setMembershipVisibility(
                    selectedUser,
                    val
                      ? selectedUser.directoryVisibility | option.value
                      : selectedUser.directoryVisibility & ~option.value
                  )
                }
              />
              <Text style={styles.visibilityText}>{option.name}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default observer(GalleryMemberEdit);

const styles = StyleSheet.create({
  row: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#ddd",
    gap: 8,
  },
  name: { fontSize: 14, fontWeight: "600" },
  adminSwitch: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { fontSize: 12 },
  visibilityArea: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  visibilityItem: { alignItems: "center" },
  visibilityText: { fontSize: 12, color: "#444" },
});
