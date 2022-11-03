import React from "react";
import { Route, Routes, useLocation } from "react-router";
import { CssBaseline, List, ListItem } from "@mui/material";
import { DirectoryPage, RootDirectoryPage } from "./components/directory-view";
import { ImagePage } from "./components/image-view";
import { ResponsiveDrawer } from "./components/responsive-drawer";
import { Link } from "react-router-dom";
import { StoresProvider, useStores } from "./stores";
import { observer } from "mobx-react-lite";
import { Users } from "./components/users";
import { SlideShow } from "./components/slideshow";
import { RedirectOrRender } from "./components/redirect-or-render";
import {
    ApiAuthorizationRoutes,
    AuthorizeProvider,
} from "folke-service-helpers";

const Menu = observer(function Menu() {
    const { usersStore } = useStores();
    const location = useLocation();
    return (
        <ResponsiveDrawer
            menu={
                <List>
                    <ListItem
                        selected={
                            location.pathname === "/" ||
                            location.pathname.startsWith("/directory")
                        }
                        component={Link}
                        to="/"
                    >
                        Galerie
                    </ListItem>
                    {usersStore.isAdministrator && (
                        <ListItem
                            selected={location.pathname === "/users"}
                            component={Link}
                            to="/users"
                        >
                            Utilisateurs
                        </ListItem>
                    )}
                </List>
            }
            title="Galerie photos"
        >
            <Routes>
                <Route
                    path="/"
                    element={
                        <RedirectOrRender>
                            <RootDirectoryPage />
                        </RedirectOrRender>
                    }
                />
                <Route
                    path="/directory/:id"
                    element={
                        <RedirectOrRender>
                            <DirectoryPage />
                        </RedirectOrRender>
                    }
                />
                <Route
                    path="/directory/:directoryId/images/:id"
                    element={
                        <RedirectOrRender>
                            <ImagePage />
                        </RedirectOrRender>
                    }
                />
                <Route
                    path="/users"
                    element={
                        <RedirectOrRender>
                            <Users />
                        </RedirectOrRender>
                    }
                />
                <Route
                    path="authentication/*"
                    element={<ApiAuthorizationRoutes />}
                />
            </Routes>
        </ResponsiveDrawer>
    );
});

function Application() {
    return (
        <AuthorizeProvider applicationName="galerie">
            <StoresProvider>
                <CssBaseline />
                <Routes>
                    <Route
                        path="/directory/:directoryId/images/:id/slideshow"
                        element={
                            <RedirectOrRender>
                                <SlideShow />
                            </RedirectOrRender>
                        }
                    />

                    <Route path="/*" element={<Menu />} />
                </Routes>
            </StoresProvider>
        </AuthorizeProvider>
    );
}

export default Application;
