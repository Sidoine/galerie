import { Login, LoginActions, LogoutActions } from "folke-service-helpers";
import React from "react";
import { Route, Routes } from "react-router";

export function ApiAuthorizationRoutes() {
    return (
        <Routes>
            <Route path={LoginActions.Login}>
                <Login loginAction="login" />
            </Route>
            <Route path={LoginActions.LoginFailed}>
                <Login loginAction="login-failed" />
            </Route>
            <Route path={LoginActions.LoginCallback}>
                <Login loginAction="login-callback" />
            </Route>
            <Route path={LoginActions.Profile}>
                <Login loginAction="profile" />
            </Route>
            <Route path={LoginActions.Register}>
                <Login loginAction="register" />
            </Route>
            {/* <Route path={LogoutActions.LogOut}>
                <Logout action="logout" />
            </Route>
            <Route path={LogoutActions.LogOutCallback}>
                <Logout action="logout-callback" />
            </Route>
            <Route path={LogoutActions.FrontChannelLogout}>
                <Logout action={LogoutActions.FrontChannelLogout} />
            </Route> */}
        </Routes>
    );
}
