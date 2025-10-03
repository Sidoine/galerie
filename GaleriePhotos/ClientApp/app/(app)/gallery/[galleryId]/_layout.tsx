import { Drawer } from "expo-router/drawer";
import { DirectoriesStoreProvider } from "@/stores/directories";
import { useLocalSearchParams } from "expo-router";
import { MembersStoreProvider, useMembersStore } from "@/stores/members";
import { MeStoreProvider } from "@/stores/me";
import { DirectoryVisibilitiesStoreProvider } from "@/stores/directory-visibilities";
import { useWindowDimensions } from "react-native";
import { UsersStoreProvider } from "@/stores/users";
import { PhotosStoreProvider } from "@/stores/photos";
import { observer } from "mobx-react-lite";

const LayoutContent = observer(function LayoutContent() {
  const membersStore = useMembersStore();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768; // Écran considéré comme large à partir de 768px

  return (
    <Drawer
      screenOptions={{
        drawerType: isLargeScreen ? "permanent" : "front",
        drawerStyle: {
          width: 280,
        },
        // Sur grand écran, masquer le bouton hamburger car le drawer est permanent
        headerLeft: isLargeScreen ? () => null : undefined,
      }}
    >
      <Drawer.Screen name="index" options={{ title: "Gallerie" }} />
      <Drawer.Screen
        name="places"
        options={{ headerShown: false, title: "Lieux" }}
      />
      <Drawer.Screen
        name="face-names"
        options={{ headerShown: false, title: "Noms des visages" }}
      />
      <Drawer.Protected guard={membersStore.administrator}>
        <Drawer.Screen
          name="settings"
          options={{ title: "Paramètres", headerShown: false }}
        />
      </Drawer.Protected>
      <Drawer.Screen
        name="directory"
        options={{
          title: "Album",
          headerShown: false,
          drawerItemStyle: { display: "none" },
        }}
      />
    </Drawer>
  );
});

export default function Layout() {
  const { galleryId } = useLocalSearchParams<"/gallery/[galleryId]">();
  return (
    <MeStoreProvider>
      <UsersStoreProvider>
        <PhotosStoreProvider galleryId={Number(galleryId)}>
          <DirectoriesStoreProvider galleryId={Number(galleryId)}>
            <DirectoryVisibilitiesStoreProvider galleryId={Number(galleryId)}>
              <MembersStoreProvider>
                <LayoutContent />
              </MembersStoreProvider>
            </DirectoryVisibilitiesStoreProvider>
          </DirectoriesStoreProvider>
        </PhotosStoreProvider>
      </UsersStoreProvider>
    </MeStoreProvider>
  );
}
