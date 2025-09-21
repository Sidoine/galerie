import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StatusBar } from 'expo-status-bar';
import { DirectoryPage } from "./components/directory-page";
import { ResponsiveDrawer } from "./components/responsive-drawer";
import { observer } from "mobx-react-lite";
import BreadCrumbs from "./components/bread-crumbs";
import { UsersStoreProvider } from "./stores/users";
import { GalleriesStoreProvider } from "./stores/galleries";
import { DirectoriesStoreProvider } from "./stores/directories";
import { DirectoryVisibilitiesStoreProvider } from "./stores/directory-visibilities";
import { ApiClientProvider } from "folke-service-helpers";
import { GalleryMembers } from "./components/gallery-members";
import { Users } from "./components/users";
import Menu from "./components/menu";
import { MembersStoreProvider } from "./stores/members";
import DirectoryVisibilitySettings from "./components/settings/directory-visibility-settings";
import AdminMenu from "./components/admin-menu";
import GalleryChooser from "./components/gallery-chooser";
import Galleries from "./components/settings/galleries";
import FaceNames from "./components/face-names";
import FaceNamePhotos from "./components/face-name-photos";
import GallerySettings from "./components/settings/gallery-settings";
import { MeStoreProvider } from "./stores/me";
import { RootDirectoryPage } from "./components/root-directory-page";

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();

function GalleryRoot({ route }: { route: any }) {
    const { galleryId } = route.params;
    return (
        <DirectoriesStoreProvider galleryId={Number(galleryId)}>
            <DirectoryVisibilitiesStoreProvider galleryId={Number(galleryId)}>
                <MeStoreProvider>
                    <UsersStoreProvider>
                        <MembersStoreProvider>
                            <Drawer.Navigator
                                drawerContent={() => <Menu />}
                                screenOptions={{
                                    headerTitle: "Galerie photo"
                                }}
                            >
                                <Drawer.Screen
                                    name="Directory"
                                    component={DirectoryPage}
                                    options={{
                                        headerTitle: () => <BreadCrumbs />
                                    }}
                                />
                                <Drawer.Screen
                                    name="FaceNames"
                                    component={FaceNames}
                                    options={{ title: "Noms des visages" }}
                                />
                                <Drawer.Screen
                                    name="FaceNamePhotos"
                                    component={FaceNamePhotos}
                                    options={{ title: "Photos du visage" }}
                                />
                                <Drawer.Screen
                                    name="GalleryMembers"
                                    component={GalleryMembers}
                                    options={{ title: "Membres" }}
                                />
                                <Drawer.Screen
                                    name="DirectoryVisibilitySettings"
                                    component={DirectoryVisibilitySettings}
                                    options={{ title: "Visibilité" }}
                                />
                                <Drawer.Screen
                                    name="GallerySettings"
                                    component={GallerySettings}
                                    options={{ title: "Paramètres" }}
                                />
                                <Drawer.Screen
                                    name="RootDirectory"
                                    component={RootDirectoryPage}
                                    options={{ title: "Galerie" }}
                                />
                            </Drawer.Navigator>
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
                <Drawer.Navigator
                    drawerContent={() => <AdminMenu />}
                    screenOptions={{
                        headerTitle: "Paramètres globaux"
                    }}
                >
                    <Drawer.Screen
                        name="Users"
                        component={Users}
                        options={{ title: "Utilisateurs" }}
                    />
                    <Drawer.Screen
                        name="Galleries"
                        component={Galleries}
                        options={{ title: "Galeries" }}
                    />
                </Drawer.Navigator>
            </MeStoreProvider>
        </UsersStoreProvider>
    );
}

const MainScreen = observer(function MainScreen() {
    return (
        <Stack.Navigator
            initialRouteName="GalleryChooser"
            screenOptions={{
                headerShown: false
            }}
        >
            <Stack.Screen
                name="GalleryChooser"
                component={GalleryChooser}
                options={{ title: "Choisir une galerie" }}
            />
            <Stack.Screen
                name="Settings"
                component={SettingsRoot}
                options={{ title: "Paramètres" }}
            />
            <Stack.Screen
                name="Gallery"
                component={GalleryRoot}
                options={{ title: "Galerie" }}
            />
        </Stack.Navigator>
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
