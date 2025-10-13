import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  StyleSheet,
} from "react-native";
import { observer } from "mobx-react-lite";
import Icon from "./Icon";
import { useMembersStore } from "@/stores/members";
import { DirectoryBulkDateModal } from "./modals/directory-bulk-date-modal";
import { DirectoryBulkLocationModal } from "./modals/directory-bulk-location-modal";
import { useDirectoriesStore } from "@/stores/directories";

interface DirectoryAdminMenuProps {
  directoryId: number;
  directoryPath: string;
}

export const DirectoryAdminMenu = observer(function DirectoryAdminMenu({
  directoryId,
  directoryPath,
}: DirectoryAdminMenuProps) {
  const membersStore = useMembersStore();
  const [menuVisible, setMenuVisible] = useState(false);
  const [dateModalVisible, setDateModalVisible] = useState(false);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  const photos = useDirectoriesStore().getPhotos(directoryId);

  // Only show for administrators
  if (!membersStore.administrator) {
    return null;
  }

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  const openDateModal = () => {
    closeMenu();
    setDateModalVisible(true);
  };

  const openLocationModal = () => {
    closeMenu();
    setLocationModalVisible(true);
  };

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={openMenu}
        style={styles.menuButton}
      >
        <Icon name="dots-vertical" set="mci" size={20} color="#007aff" />
      </TouchableOpacity>

      {/* Action Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeMenu}>
          <View style={styles.menu}>
            <MenuItem
              label="Modifier la date de toutes les photos"
              onPress={openDateModal}
            />
            <MenuItem
              label="Modifier la localisation de toutes les photos"
              onPress={openLocationModal}
            />
            <MenuItem label="Annuler" onPress={closeMenu} />
          </View>
        </Pressable>
      </Modal>

      {/* Date Modal */}
      {photos && (
        <DirectoryBulkDateModal
          visible={dateModalVisible}
          photoIds={photos.map((p) => p.id)}
          directoryPath={directoryPath}
          onClose={() => setDateModalVisible(false)}
        />
      )}

      {/* Location Modal */}
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

interface MenuItemProps {
  label: string;
  onPress: () => void;
}

function MenuItem({ label, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.menuItem}>
      <Text style={styles.menuItemText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    padding: 8,
    borderRadius: 4,
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
  menu: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    minWidth: 280,
    maxWidth: "90%",
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  menuItemText: {
    fontSize: 16,
    color: "#007aff",
    textAlign: "center",
  },
});
