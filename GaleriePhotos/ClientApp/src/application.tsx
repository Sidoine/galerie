import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import { DirectoryPage } from "./components/directory-page";
import { observer } from "mobx-react-lite";
import BreadCrumbs from "./components/bread-crumbs";
import {
  GalleryMembers,
  DirectoryVisibilitySettings,
  GallerySettings,
  Galleries,
  ImageView,
} from "./components";
import { UsersStoreProvider } from "./stores/users";
import { GalleriesStoreProvider } from "./stores/galleries";
import { DirectoriesStoreProvider } from "./stores/directories";
import { DirectoryVisibilitiesStoreProvider } from "./stores/directory-visibilities";
import { ApiClientProvider } from "folke-service-helpers";
import { Users } from "./components/users";
import { MembersStoreProvider } from "./stores/members";
import AdminMenu from "./components/admin-menu";
import GalleryChooser from "./components/gallery-chooser";
import FaceNames from "./components/face-names";
import FaceNamePhotos from "./components/face-name-photos";
import { MeStoreProvider } from "./stores/me";
import { RootDirectoryPage } from "./components/root-directory-page";

import {
  MainStackParamList,
  GalleryStackParamList,
  SettingsStackParamList,
} from "./navigation-types";

const MainStack = createBottomTabNavigator<MainStackParamList>();
const GalleryStack = createStackNavigator<GalleryStackParamList>();
const SettingsStack = createStackNavigator<SettingsStackParamList>();

function GalleryRoot({ route }: { route: any }) {
  const { galleryId } = route.params as { galleryId: number };
  return (
    <DirectoriesStoreProvider galleryId={Number(galleryId)}>
      <DirectoryVisibilitiesStoreProvider galleryId={Number(galleryId)}>
        <MeStoreProvider>
          <UsersStoreProvider>
            <MembersStoreProvider>
              <GalleryStack.Navigator
                screenOptions={{
                  headerTitle: "Galerie photo",
                }}
              >
                <GalleryStack.Screen
                  name="RootDirectory"
                  component={RootDirectoryPage}
                  options={{ title: "Galerie" }}
                />
                <GalleryStack.Screen
                  name="Directory"
                  component={DirectoryPage}
                  options={{
                    headerTitle: () => <BreadCrumbs />,
                  }}
                />
                <GalleryStack.Screen
                  name="FaceNames"
                  component={FaceNames}
                  options={{ title: "Noms des visages" }}
                />
                <GalleryStack.Screen
                  name="FaceNamePhotos"
                  component={FaceNamePhotos}
                  options={{ title: "Photos du visage" }}
                />
                <GalleryStack.Screen
                  name="GalleryMembers"
                  component={GalleryMembers}
                  options={{ title: "Membres" }}
                />
                <GalleryStack.Screen
                  name="DirectoryVisibilitySettings"
                  component={DirectoryVisibilitySettings}
                  options={{ title: "Visibilité" }}
                />
                <GalleryStack.Screen
                  name="GallerySettings"
                  component={GallerySettings}
                  options={{ title: "Paramètres" }}
                />
                <GalleryStack.Screen
                  name="Photo"
                  component={ImageView}
                  options={{ headerShown: false }}
                />
              </GalleryStack.Navigator>
            </MembersStoreProvider>
          </UsersStoreProvider>
        </MeStoreProvider>
      </DirectoryVisibilitiesStoreProvider>
    </DirectoriesStoreProvider>
  );
}

function SettingsRoot() {
  return (
    <UsersStoreProvider>
      <MeStoreProvider>
        <SettingsStack.Navigator
          screenOptions={{
            headerTitle: "Paramètres globaux",
          }}
        >
          <SettingsStack.Screen
            name="Users"
            component={Users}
            options={{ title: "Utilisateurs" }}
          />
          <SettingsStack.Screen
            name="Galleries"
            component={Galleries}
            options={{ title: "Galeries" }}
          />
        </SettingsStack.Navigator>
      </MeStoreProvider>
    </UsersStoreProvider>
  );
}

const MainScreen = observer(function MainScreen() {
  return (
    <MainStack.Navigator
      initialRouteName="GalleryChooser"
      screenOptions={{
        headerShown: false,
      }}
    >
      <MainStack.Screen
        name="GalleryChooser"
        component={GalleryChooser}
        options={{ title: "Choisir une galerie" }}
      />
      <MainStack.Screen
        name="Settings"
        component={SettingsRoot}
        options={{ title: "Paramètres" }}
      />
      <MainStack.Screen
        name="Gallery"
        component={GalleryRoot}
        options={{ title: "Galerie" }}
      />
    </MainStack.Navigator>
  );
});

function Application() {
  return (
    <ApiClientProvider>
      <GalleriesStoreProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <MainScreen />
        </NavigationContainer>
      </GalleriesStoreProvider>
    </ApiClientProvider>
  );
}

export default Application;
