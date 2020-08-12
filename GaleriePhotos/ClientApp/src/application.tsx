import React from "react";
import { Route, useLocation, Switch } from "react-router";
import AuthorizeRoute from "./components/api-authorization/authorize-route";
import ApiAuthorizationRoutes from "./components/api-authorization/api-authorization-routes";
import { ApplicationPaths } from "./stores/authorize";
import { CssBaseline, List, ListItem } from "@material-ui/core";
import { DirectoryView, RootDirectoryView } from "./components/directory-view";
import { ImageView } from "./components/image-view";
import { ResponsiveDrawer } from "./components/responsive-drawer";
import { Link } from "react-router-dom";
import { useStores } from "./stores";
import { observer } from "mobx-react-lite";
import { Users } from "./components/users";
import { SlideShow } from "./components/slideshow";

function Menu() {
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
            <AuthorizeRoute
                exact
                path="/"
                render={() => <RootDirectoryView />}
            />
            <AuthorizeRoute<{ id: string }>
                exact
                path="/directory/:id"
                render={(r) => (
                    <DirectoryView id={parseInt(r.match.params.id)} />
                )}
            />
            <AuthorizeRoute<{ directoryId: string; id: string }>
                exact
                path="/directory/:directoryId/images/:id"
                render={(r) => (
                    <ImageView
                        id={parseInt(r.match.params.id)}
                        directoryId={parseInt(r.match.params.directoryId)}
                    />
                )}
            />
            <AuthorizeRoute exact path="/users" render={() => <Users />} />
            <Route
                path={ApplicationPaths.ApiAuthorizationPrefix}
                component={ApiAuthorizationRoutes}
            />
        </ResponsiveDrawer>
    );
}

const Application = observer(() => {
    return (
        <>
            <CssBaseline />
            <Switch>
                <AuthorizeRoute<{ directoryId: string; id: string }>
                    exact
                    path="/directory/:directoryId/images/:id/slideshow"
                    render={(r) => (
                        <SlideShow
                            id={parseInt(r.match.params.id)}
                            directoryId={parseInt(r.match.params.directoryId)}
                        />
                    )}
                />
                <Route>
                    <Menu />
                </Route>
            </Switch>
        </>
    );
});

export default Application;
