import React, { useState, useCallback } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { observer } from "mobx-react-lite";
import Icon from "./Icon";
import { useMembersStore } from "@/stores/members";
import { DirectoryBulkDateModal } from "./modals/directory-bulk-date-modal";
import { DirectoryBulkLocationModal } from "./modals/directory-bulk-location-modal";
import { ActionMenu, ActionMenuItem } from "./action-menu";
import { Photo } from "@/services/views";

interface DirectoryAdminMenuProps {
  directoryPath: string;
}

export const DirectoryAdminMenu = observer(function DirectoryAdminMenu({
  directoryPath,
}: DirectoryAdminMenuProps) {
  const membersStore = useMembersStore();
  const [menuVisible, setMenuVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  // TODO
  const photos: Photo[] = [];

  // NOTE: tous les hooks doivent être déclarés avant tout return conditionnel.

  const openMenu = useCallback(() => setMenuVisible(true), []);
  const closeMenu = useCallback(() => setMenuVisible(false), []);

  const openDateModal = useCallback(() => {
    closeMenu();
    setDateModalVisible(true);
  }, [closeMenu]);

  const openLocationModal = useCallback(() => {
    closeMenu();
    setLocationModalVisible(true);
  }, [closeMenu]);

  const items: ActionMenuItem[] = [
    {
      label: "Modifier la date de toutes les photos",
      onPress: openDateModal,
    },
    {
      label: "Modifier la localisation de toutes les photos",
      onPress: openLocationModal,
    },
    { label: "Annuler", onPress: closeMenu },
  ];

  if (!membersStore.administrator) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={openMenu}
        style={styles.menuButton}
      >
        <Icon name="dots-vertical" set="mci" size={20} color="#007aff" />
      </TouchableOpacity>
      <ActionMenu
        visible={menuVisible}
        onClose={closeMenu}
        items={items}
        minWidth={300}
      />
      {photos && (
        <DirectoryBulkDateModal
          visible={dateModalVisible}
          photoIds={photos.map((p) => p.id)}
          directoryPath={directoryPath}
          onClose={() => setDateModalVisible(false)}
        />
      )}
      {photos && (
        <DirectoryBulkLocationModal
          visible={locationModalVisible}
          photos={photos}
          onClose={() => setLocationModalVisible(false)}
        />
      )}
    </>
  );
});

const styles = StyleSheet.create({
  menuButton: {
    padding: 8,
    borderRadius: 4,
  },
});
