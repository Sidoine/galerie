import { Drawer } from "expo-router/drawer";
import { DirectoriesStoreProvider } from "@/stores/directories";
import { useLocalSearchParams } from "expo-router";
import { MembersStoreProvider } from "@/stores/members";
import { MeStoreProvider } from "@/stores/me";
import { DirectoryVisibilitiesStoreProvider } from "@/stores/directory-visibilities";
import { Text } from "react-native";
import { UsersStoreProvider } from "@/stores/users";

export default function Layout() {
  const { galleryId } = useLocalSearchParams<{ galleryId: string }>();
  if (!galleryId) return <Text>No gallery id</Text>;
  return (
    <MeStoreProvider>
      <UsersStoreProvider>
        <DirectoriesStoreProvider galleryId={Number(galleryId)}>
          <DirectoryVisibilitiesStoreProvider galleryId={Number(galleryId)}>
            <MembersStoreProvider>
              <Drawer>
                <Drawer.Screen name="index" options={{ title: "Gallerie" }} />
                <Drawer.Screen
                  name="face-names"
                  options={{ title: "Noms des visages" }}
                />
                <Drawer.Screen
                  name="settings"
                  options={{ title: "Paramètres" }}
                />
                <Drawer.Screen
                  name="directory"
                  options={{
                    title: "Album",
                    drawerItemStyle: { display: "none" },
                  }}
                />
                <Drawer.Screen
                  name="photos"
                  options={{
                    title: "Photo",
                    drawerItemStyle: { display: "none" },
                  }}
                />
              </Drawer>
            </MembersStoreProvider>
          </DirectoryVisibilitiesStoreProvider>
        </DirectoriesStoreProvider>
      </UsersStoreProvider>
    </MeStoreProvider>
  );
}
