import { Route, Routes, useParams } from "react-router";
import { CssBaseline } from "@mui/material";
import { DirectoryPage, RootDirectoryPage } from "./components/directory-view";
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
import GallerySettings from "./components/settings/gallery-settings";

function GalleryRoot() {
    const { galleryId } = useParams();
    return (
        <DirectoriesStoreProvider galleryId={Number(galleryId)}>
            <DirectoryVisibilitiesStoreProvider galleryId={Number(galleryId)}>
                <UsersStoreProvider>
                    <MembersStoreProvider>
                        <ResponsiveDrawer
                            menu={<Menu />}
                            title={
                                <Routes>
                                    <Route
                                        path="/directory/:directoryId/*"
                                        element={<BreadCrumbs />}
                                    ></Route>
                                    <Route
                                        path="*"
                                        element={<>Galerie photo</>}
                                    />
                                </Routes>
                            }
                        >
                            <Routes>
                                <Route
                                    path="/directory/:id/*"
                                    element={<DirectoryPage />}
                                />
                                <Route
                                    path="/settings/members"
                                    element={<GalleryMembers />}
                                />
                                <Route
                                    path="/settings/visibility"
                                    element={<DirectoryVisibilitySettings />}
                                />
                                <Route
                                    path="/settings/gallery"
                                    element={<GallerySettings />}
                                />
                                <Route
                                    path="*"
                                    element={<RootDirectoryPage />}
                                />
                            </Routes>
                        </ResponsiveDrawer>
                    </MembersStoreProvider>
                </UsersStoreProvider>
            </DirectoryVisibilitiesStoreProvider>
        </DirectoriesStoreProvider>
    );
}

function SettingsRoot() {
    return (
        <UsersStoreProvider>
            <ResponsiveDrawer menu={<AdminMenu />} title={"Paramètres globaux"}>
                <Routes>
                    <Route path="/users" element={<Users />} />
                    <Route path="/galleries" element={<Galleries />} />
                </Routes>
            </ResponsiveDrawer>
        </UsersStoreProvider>
    );
}

const MainScreen = observer(function MainScreen() {
    return (
        <Routes>
            <Route path="/" element={<GalleryChooser />} />
            <Route path="/settings/*" element={<SettingsRoot />} />
            <Route path="/g/:galleryId/*" element={<GalleryRoot />} />
        </Routes>
    );
});

function Application() {
    return (
        <ApiClientProvider>
            <GalleriesStoreProvider>
                <CssBaseline />

                <MainScreen />
            </GalleriesStoreProvider>
        </ApiClientProvider>
    );
}

export default Application;
