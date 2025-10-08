import { Drawer } from "expo-router/drawer";
import {
  DirectoriesStoreProvider,
  useDirectoriesStore,
} from "@/stores/directories";
import { useGlobalSearchParams, useLocalSearchParams } from "expo-router";
import { MembersStoreProvider, useMembersStore } from "@/stores/members";
import { MeStoreProvider } from "@/stores/me";
import { DirectoryVisibilitiesStoreProvider } from "@/stores/directory-visibilities";
import { useWindowDimensions } from "react-native";
import { UsersStoreProvider } from "@/stores/users";
import { PhotosStoreProvider } from "@/stores/photos";
import { observer } from "mobx-react-lite";
import BreadCrumbs from "@/components/bread-crumbs";
import { DirectoryStoreProvider } from "@/stores/directory";
import { FaceNameStoreProvider } from "@/stores/face-name";
import { FaceNamesStoreProvider } from "@/stores/face-names";
import { PlacesStoreProvider } from "@/stores/places";
import { PlaceStoreProvider } from "@/stores/place";

const LayoutContent = observer(function LayoutContent() {
  const membersStore = useMembersStore();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768; // Écran considéré comme large à partir de 768px
  const { directoryId, order, faceNameId, placeId, year, month } =
    useGlobalSearchParams<{
      directoryId?: string;
      faceNameId?: string;
      placeId?: string;
      order: "date-asc" | "date-desc";
      year?: string;
      month?: string;
    }>();
  const directoriesStore = useDirectoriesStore();
  const root = directoriesStore.root;

  return (
    <DirectoryStoreProvider
      directoryId={directoryId ? Number(directoryId) : root?.id}
      order={order}
    >
      <FaceNameStoreProvider
        faceNameId={faceNameId ? Number(faceNameId) : undefined}
        order={order}
      >
        <PlaceStoreProvider
          placeId={placeId ? Number(placeId) : undefined}
          year={year ? Number(year) : undefined}
          month={month ? Number(month) : undefined}
          order={order}
        >
          <Drawer
            screenOptions={{
              drawerType: isLargeScreen ? "permanent" : undefined,
              drawerStyle: {
                width: 280,
              },
              // Sur grand écran, masquer le bouton hamburger car le drawer est permanent
              headerLeft: isLargeScreen ? () => null : undefined,
            }}
          >
            <Drawer.Screen
              name="index"
              options={{
                title: "Albums",
                drawerItemStyle: { display: "none" },
                headerTitle: () => <BreadCrumbs />,
              }}
            />
            <Drawer.Screen
              name="directory/index"
              options={{ title: "Albums", headerTitle: () => <BreadCrumbs /> }}
            />
            <Drawer.Screen
              name="directory/[directoryId]/photos/[photoId]"
              options={{
                title: "Photo",
                headerShown: false,
                drawerItemStyle: { display: "none" },
              }}
            />
            <Drawer.Screen
              name="directory/[directoryId]/index"
              options={{
                title: "Album",
                headerTitle: () => <BreadCrumbs />,
                drawerItemStyle: { display: "none" },
              }}
            />

            <Drawer.Screen name="places/index" options={{ title: "Lieux" }} />
            <Drawer.Screen
              name="places/[placeId]/photos/[photoId]"
              options={{
                title: "Photo",
                headerShown: false,
                drawerItemStyle: { display: "none" },
              }}
            />
            <Drawer.Screen
              name="places/[placeId]/index"
              options={{
                title: "Album",
                headerTitle: () => <BreadCrumbs />,
                drawerItemStyle: { display: "none" },
              }}
            />
            <Drawer.Screen
              name="face-names/index"
              options={{ title: "Visages" }}
            />
            <Drawer.Screen
              name="face-names/[faceNameId]/photos/[photoId]"
              options={{
                title: "Photo",
                headerShown: false,
                drawerItemStyle: { display: "none" },
              }}
            />
            <Drawer.Screen
              name="face-names/[faceNameId]/index"
              options={{
                title: "Album",
                headerTitle: () => <BreadCrumbs />,
                drawerItemStyle: { display: "none" },
              }}
            />
            <Drawer.Protected guard={membersStore.administrator}>
              <Drawer.Screen
                name="settings"
                options={{ title: "Paramètres", headerShown: false }}
              />
            </Drawer.Protected>
          </Drawer>
        </PlaceStoreProvider>
      </FaceNameStoreProvider>
    </DirectoryStoreProvider>
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
              <FaceNamesStoreProvider galleryId={Number(galleryId)}>
                <PlacesStoreProvider galleryId={Number(galleryId)}>
                  <MembersStoreProvider>
                    <LayoutContent />
                  </MembersStoreProvider>
                </PlacesStoreProvider>
              </FaceNamesStoreProvider>
            </DirectoryVisibilitiesStoreProvider>
          </DirectoriesStoreProvider>
        </PhotosStoreProvider>
      </UsersStoreProvider>
    </MeStoreProvider>
  );
}
