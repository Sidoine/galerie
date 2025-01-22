import { Route, Routes, useLocation } from "react-router";
import { CssBaseline, List, ListItemButton } from "@mui/material";
import { DirectoryPage, RootDirectoryPage } from "./components/directory-view";
import { ResponsiveDrawer } from "./components/responsive-drawer";
import { Link } from "react-router-dom";
import { StoresProvider, useStores } from "./stores";
import { observer } from "mobx-react-lite";
import { Users } from "./components/users";
import BreadCrumbs from "./components/bread-crumbs";

const Menu = observer(function Menu() {
    const { usersStore } = useStores();
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
                    {usersStore.isAdministrator && (
                        <ListItemButton
                            selected={location.pathname === "/users"}
                            component={Link}
                            to="/users"
                        >
                            Utilisateurs
                        </ListItemButton>
                    )}
                </List>
            }
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
                <Route path="/" element={<RootDirectoryPage />} />
                <Route path="/directory/:id/*" element={<DirectoryPage />} />
                <Route path="/users" element={<Users />} />
            </Routes>
        </ResponsiveDrawer>
    );
});

function Application() {
    return (
        <StoresProvider>
            <CssBaseline />

            <Menu />
        </StoresProvider>
    );
}

export default Application;
