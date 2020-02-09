import React, { Component, Fragment } from "react";
import { Route } from "react-router";
import { Login } from "./login";
import { Logout } from "./logout";
import {
  ApplicationPaths,
  LogoutAction,
  LoginAction
} from "../../stores/authorize";

export default class ApiAuthorizationRoutes extends Component {
  render() {
    return (
      <Fragment>
        <Route
          path={ApplicationPaths.Login}
          render={() => loginAction("login")}
        />
        <Route
          path={ApplicationPaths.LoginFailed}
          render={() => loginAction("login-failed")}
        />
        <Route
          path={ApplicationPaths.LoginCallback}
          render={() => loginAction("login-callback")}
        />
        <Route
          path={ApplicationPaths.Profile}
          render={() => loginAction("profile")}
        />
        <Route
          path={ApplicationPaths.Register}
          render={() => loginAction("register")}
        />
        <Route
          path={ApplicationPaths.LogOut}
          render={() => logoutAction("logout")}
        />
        <Route
          path={ApplicationPaths.LogOutCallback}
          render={() => logoutAction("logout-callback")}
        />
        <Route
          path={ApplicationPaths.LoggedOut}
          render={() => logoutAction("logged-out")}
        />
      </Fragment>
    );
  }
}

function loginAction(name: LoginAction) {
  return <Login action={name}></Login>;
}

function logoutAction(name: LogoutAction) {
  return <Logout action={name}></Logout>;
}
