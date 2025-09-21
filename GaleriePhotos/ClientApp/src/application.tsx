import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { DirectoryPage } from "./components/directory-page";
import { observer } from "mobx-react-lite";
import BreadCrumbs from "./components/bread-crumbs";
import { GalleryMembers, DirectoryVisibilitySettings, GallerySettings, Galleries } from "./components/migrated-placeholders";
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

const Stack = createStackNavigator();

function GalleryRoot({ route }: { route: any }) {
    const { galleryId } = route.params;
    return (
        <DirectoriesStoreProvider galleryId={Number(galleryId)}>
            <DirectoryVisibilitiesStoreProvider galleryId={Number(galleryId)}>
                <MeStoreProvider>
                    <UsersStoreProvider>
                        <MembersStoreProvider>
                            <Stack.Navigator
                                screenOptions={{
                                    headerTitle: "Galerie photo"
                                }}
                            >
                                <Stack.Screen
                                    name="RootDirectory"
                                    component={RootDirectoryPage}
                                    options={{ title: "Galerie" }}
                                />
                                <Stack.Screen
                                    name="Directory"
                                    component={DirectoryPage}
                                    options={{ 
                                        headerTitle: () => <BreadCrumbs />
                                    }}
                                />
                                <Stack.Screen
                                    name="FaceNames"
                                    component={FaceNames}
                                    options={{ title: "Noms des visages" }}
                                />
                                <Stack.Screen
                                    name="FaceNamePhotos"
                                    component={FaceNamePhotos}
                                    options={{ title: "Photos du visage" }}
                                />
                                <Stack.Screen
                                    name="GalleryMembers"
                                    component={GalleryMembers}
                                    options={{ title: "Membres" }}
                                />
                                <Stack.Screen
                                    name="DirectoryVisibilitySettings"
                                    component={DirectoryVisibilitySettings}
                                    options={{ title: "Visibilité" }}
                                />
                                <Stack.Screen
                                    name="GallerySettings"
                                    component={GallerySettings}
                                    options={{ title: "Paramètres" }}
                                />
                            </Stack.Navigator>
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
                <Stack.Navigator
                    screenOptions={{
                        headerTitle: "Paramètres globaux"
                    }}
                >
                    <Stack.Screen
                        name="Users"
                        component={Users}
                        options={{ title: "Utilisateurs" }}
                    />
                    <Stack.Screen
                        name="Galleries"
                        component={Galleries}
                        options={{ title: "Galeries" }}
                    />
                </Stack.Navigator>
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
