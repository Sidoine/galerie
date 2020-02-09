import React from "react";
import { Route } from "react-router";
import AuthorizeRoute from "./components/api-authorization/authorize-route";
import ApiAuthorizationRoutes from "./components/api-authorization/api-authorization-routes";
import { ApplicationPaths } from "./stores/authorize";
import { CssBaseline, makeStyles } from "@material-ui/core";
import { NavMenu } from "./components/nav-menu";
import { DirectoryView } from "./components/directory-view";

const useStyles = makeStyles(theme => ({
  offset: theme.mixins.toolbar
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
        render={() => <DirectoryView path={null} />}
      />
      <AuthorizeRoute<{ dir: string }>
        exact
        path="/directory/:dir*"
        render={r => <DirectoryView path={r.match.params.dir} />}
      />
      <Route
        path={ApplicationPaths.ApiAuthorizationPrefix}
        component={ApiAuthorizationRoutes}
      />
    </>
  );
}
