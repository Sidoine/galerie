import {
    Route,
    Routes,
    useLocation,
    useNavigate,
    useParams,
} from "react-router";
import { CssBaseline, List, ListItemButton } from "@mui/material";
import { DirectoryPage, RootDirectoryPage } from "./components/directory-view";
import { ResponsiveDrawer } from "./components/responsive-drawer";
import { Link } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { Users } from "./components/users";
import BreadCrumbs from "./components/bread-crumbs";
import { UsersStoreProvider } from "./stores/users";
import { GalleriesStoreProvider, useGalleriesStore } from "./stores/galleries";
import { DirectoriesStoreProvider } from "./stores/directories";
import { ApiClientProvider } from "folke-service-helpers";

function GalleryRoot() {
    const { galleryId } = useParams();
    return (
        <DirectoriesStoreProvider galleryId={Number(galleryId)}>
            <UsersStoreProvider>
                <Routes>
                    <Route path="/" element={<RootDirectoryPage />} />
                    <Route
                        path="/directory/:id/*"
                        element={<DirectoryPage />}
                    />
                    <Route path="/users" element={<Users />} />
                </Routes>
            </UsersStoreProvider>
        </DirectoriesStoreProvider>
    );
}

const MainScreen = observer(function MainScreen() {
    // const usersStore = useUsersStore();
    const location = useLocation();
    return (
        <ResponsiveDrawer
            menu={
                <List>
                    <ListItemButton
                        selected={
                            location.pathname === "/" ||
                            location.pathname.startsWith("/directory")
                        }
                        component={Link}
                        to="/"
                    >
                        Galerie
                    </ListItemButton>
                    {/* {usersStore.isAdministrator && (
                        <ListItemButton
                            selected={location.pathname === "/users"}
                            component={Link}
                            to="/users"
                        >
                            Utilisateurs
                        </ListItemButton>
                    )} */}
                </List>
            }
            title={
                <Routes>
                    <Route
                        path="/g/:galleryId/directory/:directoryId/*"
                        element={<BreadCrumbs />}
                    ></Route>
                    <Route path="*" element={<>Galerie photo</>} />
                </Routes>
            }
        >
            <Routes>
                <Route path="/" element={<GalleryChooser />} />
                <Route path="/g/:galleryId/*" element={<GalleryRoot />} />
            </Routes>
        </ResponsiveDrawer>
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
