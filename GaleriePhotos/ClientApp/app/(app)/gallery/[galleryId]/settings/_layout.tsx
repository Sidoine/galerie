import Drawer from "expo-router/drawer";
import Icon from "@/components/Icon";

export default function GallerySettingsLayout() {
  return (
    <Drawer>
      <Drawer.Screen
        name="index"
        options={{
          title: "Paramètres de la galerie",
          drawerIcon: ({ color, size }) => (
            <Icon set="mci" name="cog" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="gallery-members"
        options={{
          title: "Membres",
          drawerIcon: ({ color, size }) => (
            <Icon set="mci" name="account-multiple" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="directory-visibility-settings"
        options={{
          title: "Paramètres de visibilité",
          drawerIcon: ({ color, size }) => (
            <Icon set="mci" name="eye-settings" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="back"
        options={{
          title: "Retour",
          drawerIcon: ({ color, size }) => (
            <Icon set="ion" name="arrow-back" color={color} size={size} />
          ),
        }}
      />
    </Drawer>
  );
}
