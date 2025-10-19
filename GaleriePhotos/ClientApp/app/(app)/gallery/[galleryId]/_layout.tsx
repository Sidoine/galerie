import { Drawer } from "expo-router/drawer";
import { DirectoriesStoreProvider } from "@/stores/directories";
import { useGlobalSearchParams } from "expo-router";
import { MembersStoreProvider, useMembersStore } from "@/stores/members";
import { MeStoreProvider } from "@/stores/me";
import { DirectoryVisibilitiesStoreProvider } from "@/stores/directory-visibilities";
import { Platform, useWindowDimensions } from "react-native";
import { UsersStoreProvider } from "@/stores/users";
import { PhotosStoreProvider } from "@/stores/photos";
import { observer } from "mobx-react-lite";
import BreadCrumbs from "@/components/bread-crumbs";
import { DirectoryStoreProvider, useDirectoryStore } from "@/stores/directory";
import { FaceNameStoreProvider, useFaceNameStore } from "@/stores/face-name";
import { FaceNamesStoreProvider } from "@/stores/face-names";
import { PlacesStoreProvider } from "@/stores/places";
import { PlaceStoreProvider, usePlaceStore } from "@/stores/place";
import Icon from "@/components/Icon";
import { GalleryStoreProvider, useGalleryStore } from "@/stores/gallery";
import { SearchStoreProvider, useSearchStore } from "@/stores/search";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

const GalleryLayoutContent = observer(function LayoutContent() {
  const membersStore = useMembersStore();
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= 768 && Platform.OS === "web";

  const placeStore = usePlaceStore();
  const faceNameStore = useFaceNameStore();
  const directoryStore = useDirectoryStore();
  const galleryStore = useGalleryStore();
  const searchStore = useSearchStore();

  return (
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
          title: "Accueil",
          headerTitle: () => <BreadCrumbs store={galleryStore} />,
          drawerIcon: ({ color, size }) => (
            <Icon set="mci" name="home" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="photos/[photoId]"
        options={{
          title: "Photo",
          headerShown: false,
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="directory/index"
        options={{
          title: "Albums",
          headerTitle: () => <BreadCrumbs store={directoryStore} />,
          drawerIcon: ({ color, size }) => (
            <Icon
              set="mci"
              name="folder-multiple-image"
              color={color}
              size={size}
            />
          ),
        }}
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
          headerTitle: () => <BreadCrumbs store={directoryStore} />,
          drawerItemStyle: { display: "none" },
        }}
      />

      <Drawer.Screen
        name="places/index"
        options={{
          title: "Lieux",
          headerTitle: () => <BreadCrumbs store={placeStore} />,
          drawerIcon: ({ color, size }) => (
            <Icon set="ion" name="map" color={color} size={size} />
          ),
        }}
      />
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
          headerTitle: () => <BreadCrumbs store={placeStore} />,
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Screen
        name="face-names/index"
        options={{
          title: "Visages",
          drawerIcon: ({ color, size }) => (
            <Icon set="mci" name="face-recognition" color={color} size={size} />
          ),
        }}
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
          headerTitle: () => <BreadCrumbs store={faceNameStore} />,
          drawerItemStyle: { display: "none" },
        }}
      />
      <Drawer.Protected guard={membersStore.administrator}>
        <Drawer.Screen
          name="dashboard"
          options={{
            title: "Tableau de bord",
            headerTitle: () => <DashboardHeader title="Tableau de bord" />,
            drawerIcon: ({ color, size }) => (
              <Icon set="mci" name="view-dashboard" color={color} size={size} />
            ),
          }}
        />
        <Drawer.Screen
          name="settings"
          options={{
            title: "Paramètres",
            headerShown: false,
            drawerIcon: ({ color, size }) => (
              <Icon set="mci" name="cog" color={color} size={size} />
            ),
          }}
        />
      </Drawer.Protected>
      <Drawer.Screen
        name="search/index"
        options={{
          title: "Recherche",
          drawerItemStyle: { display: "none" },
          headerTitle: () => <BreadCrumbs store={searchStore} />,
          drawerIcon: ({ color, size }) => (
            <Icon set="mci" name="magnify" color={color} size={size} />
          ),
        }}
      />
      <Drawer.Screen
        name="search/photos/[photoId]"
        options={{
          title: "Photo",
          drawerItemStyle: { display: "none" },
          headerShown: false,
        }}
      />
    </Drawer>
  );
});

export default function GalleryLayout() {
  const {
    galleryId,
    directoryId,
    order,
    faceNameId,
    placeId,
    year,
    month,
    query,
  } = useGlobalSearchParams<{
    galleryId: string;
    directoryId?: string;
    faceNameId?: string;
    placeId?: string;
    order: "date-asc" | "date-desc";
    year?: string;
    month?: string;
    query?: string;
  }>();

  return (
    <MeStoreProvider>
      <UsersStoreProvider>
        <PhotosStoreProvider galleryId={Number(galleryId)}>
          <DirectoriesStoreProvider galleryId={Number(galleryId)}>
            <DirectoryVisibilitiesStoreProvider galleryId={Number(galleryId)}>
              <FaceNamesStoreProvider galleryId={Number(galleryId)}>
                <PlacesStoreProvider galleryId={Number(galleryId)}>
                  <MembersStoreProvider>
                    <GalleryStoreProvider
                      galleryId={Number(galleryId)}
                      order={order}
                    >
                      <DirectoryStoreProvider
                        directoryId={
                          directoryId
                            ? directoryId === "index"
                              ? directoryId
                              : Number(directoryId)
                            : undefined
                        }
                        order={order}
                      >
                        <FaceNameStoreProvider
                          faceNameId={
                            faceNameId ? Number(faceNameId) : undefined
                          }
                          order={order}
                        >
                          <PlaceStoreProvider
                            placeId={placeId ? Number(placeId) : undefined}
                            year={year ? Number(year) : undefined}
                            month={month ? Number(month) : undefined}
                            order={order}
                          >
                            <SearchStoreProvider
                              galleryId={Number(galleryId)}
                              query={query}
                              order={order}
                            >
                              <GalleryLayoutContent />
                            </SearchStoreProvider>
                          </PlaceStoreProvider>
                        </FaceNameStoreProvider>
                      </DirectoryStoreProvider>
                    </GalleryStoreProvider>
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
