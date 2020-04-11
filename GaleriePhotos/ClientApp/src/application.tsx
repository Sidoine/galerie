import React from "react";
import { Route } from "react-router";
import AuthorizeRoute from "./components/api-authorization/authorize-route";
import ApiAuthorizationRoutes from "./components/api-authorization/api-authorization-routes";
import { ApplicationPaths } from "./stores/authorize";
import { CssBaseline, makeStyles } from "@material-ui/core";
import { NavMenu } from "./components/nav-menu";
import { DirectoryView, RootDirectoryView } from "./components/directory-view";
import { ImageView } from "./components/image-view";

const useStyles = makeStyles((theme) => ({
    offset: theme.mixins.toolbar,
}));

export default function Application() {
    const classes = useStyles();
    return (
        <>
            <CssBaseline />
            <NavMenu />
            <div className={classes.offset} />
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
            <Route
                path={ApplicationPaths.ApiAuthorizationPrefix}
                component={ApiAuthorizationRoutes}
            />
        </>
    );
}
