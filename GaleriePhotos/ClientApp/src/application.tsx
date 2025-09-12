import { Route, Routes, useNavigate, useParams, useLocation } from "react-router";
import { CssBaseline, List, ListItemButton } from "@mui/material";
import { DirectoryPage, RootDirectoryPage } from "./components/directory-view";
import { ResponsiveDrawer } from "./components/responsive-drawer";
import { observer } from "mobx-react-lite";
import BreadCrumbs from "./components/bread-crumbs";
import { UsersStoreProvider } from "./stores/users";
import { GalleriesStoreProvider, useGalleriesStore } from "./stores/galleries";
import { DirectoriesStoreProvider } from "./stores/directories";
import { DirectoryVisibilitiesStoreProvider } from "./stores/directory-visibilities";
import { ApiClientProvider } from "folke-service-helpers";
import { GalleryMembers } from "./components/gallery-members";
import { Users } from "./components/users";
import Menu from "./components/menu";
import { MembersStoreProvider } from "./stores/members";
import DirectoryVisibilitySettings from "./components/settings/directory-visibility-settings";

function GalleryRoot() {
    const { galleryId } = useParams();
    const location = useLocation();
    return (
        <DirectoriesStoreProvider galleryId={Number(galleryId)}>
            <DirectoryVisibilitiesStoreProvider galleryId={Number(galleryId)}>
                <MembersStoreProvider>
                    <UsersStoreProvider>
                        <ResponsiveDrawer
                            menu={<Menu />}
                            title={
                                <Routes>
                                    <Route
                                        path="/directory/:directoryId/*"
                                        element={<BreadCrumbs />}
                                    ></Route>
                                    <Route path="*" element={<>Galerie photo</>} />
                                </Routes>
                            }
                        >
                            <Routes>
                                <Route
                                    path="/directory/:id/*"
                                    element={<DirectoryPage />}
                                />
                                <Route
                                    path="/members"
                                    element={<GalleryMembers />}
                                />
                                <Route
                                    path="/settings/visibility"
                                    element={<DirectoryVisibilitySettings />}
                                />
                                <Route path="*" element={<RootDirectoryPage />} />
                            </Routes>
                        </ResponsiveDrawer>
                    </UsersStoreProvider>
                </MembersStoreProvider>
            </DirectoryVisibilitiesStoreProvider>
        </DirectoriesStoreProvider>
    );
}

const MainScreen = observer(function MainScreen() {
    return (
        <Routes>
            <Route path="/" element={<GalleryChooser />} />
            <Route
                path="/users"
                element={
                    <UsersStoreProvider>
                        <Users />
                    </UsersStoreProvider>
                }
            />
            <Route path="/g/:galleryId/*" element={<GalleryRoot />} />
        </Routes>
    );
});

const GalleryChooser = observer(function GalleryChooser() {
    const galleriesStore = useGalleriesStore();
    const navigate = useNavigate();
    if (!galleriesStore.memberships && !galleriesStore.loading) {
        galleriesStore.load();
    }
    const memberships = galleriesStore.memberships;
    if (!memberships) return <>Chargement...</>;
    if (memberships.length === 1) {
        const galleryId = memberships[0].galleryId;
        navigate(`/g/${galleryId}`, { replace: true });
    }
    return (
        <List>
            {memberships.map((m) => (
                <ListItemButton
                    key={m.galleryId}
                    onClick={() => {
                        navigate(`/g/${m.galleryId}`);
                    }}
                >
                    {m.galleryName}
                </ListItemButton>
            ))}
        </List>
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
