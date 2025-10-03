import Drawer from "expo-router/drawer";

export default function Layout() {
  return (
    <Drawer>
      <Drawer.Screen
        name="index"
        options={{ title: "Paramètres de la galerie" }}
      />
      <Drawer.Screen name="gallery-members" options={{ title: "Membres" }} />
      <Drawer.Screen
        name="directory-visibility-settings"
        options={{ title: "Paramètres de visibilité" }}
      />
      <Drawer.Screen name="back" options={{ title: "Retour" }} />
    </Drawer>
  );
}
