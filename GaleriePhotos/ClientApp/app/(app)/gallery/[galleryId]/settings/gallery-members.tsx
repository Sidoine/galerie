import { observer } from "mobx-react-lite";
import { useMembersStore } from "../../../../../stores/members";
import GalleryMemberCreate from "@/components/gallery-members/gallery-member-create";
import GalleryMemberEdit from "@/components/gallery-members/gallery-member-edit";
import React from "react";
import { View, Text, StyleSheet } from "react-native";

const GalleryMembers = observer(function GalleryMembers() {
  const membersStore = useMembersStore();
  const memberships = membersStore.members;
  return (
    <View style={styles.container}>
      <GalleryMemberCreate />
      {memberships && memberships.length > 0 && (
        <View style={styles.list}>
          <Text style={styles.heading}>Membres</Text>
          {memberships.map((m) => (
            <GalleryMemberEdit key={m.id} selectedUser={m} />
          ))}
        </View>
      )}
    </View>
  );
});

export default GalleryMembers;

const styles = StyleSheet.create({
  container: { padding: 12 },
  list: { marginTop: 8, gap: 4 },
  heading: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
});
