import React, { useEffect } from "react";
import { SigninState, useAuthorize } from "folke-service-helpers";
import { QueryParameterNames, LoginAction } from "folke-service-helpers";
import { useLocalStore, observer } from "mobx-react-lite";
import { action } from "mobx";
import { Alert, LinearProgress } from "@mui/material";

export interface LoginProps {
    loginAction: LoginAction;
}

// The main responsibility of this component is to handle the user's login process.
// This is the starting point for the login process. Any component that needs to authenticate
// a user can simply perform a redirect to this component with a returnUrl query parameter and
// let the component perform the login and return back to the return url.
export const Login = observer(({ loginAction }: LoginProps) => {
    const authorizeService = useAuthorize();
    const store = useLocalStore(() => ({
        message: null as null | string,
        setMessage: action((message: string | null) => {
            store.message = message;
        }),
        login: async (returnUrl: string) => {
            const state = { returnUrl };
            const result = await authorizeService.signIn(state);
            switch (result.status) {
                case "redirect":
                    break;
                case "success":
                    store.navigateToReturnUrl(returnUrl);
                    break;
                case "fail":
                    store.setMessage(result.message);
                    break;
            }
        },
        processLoginCallback: async () => {
            const url = window.location.href;
            const result = await authorizeService.completeSignIn(url);
            switch (result.status) {
                case "redirect":
                    // There should not be any redirects as the only time completeSignIn finishes
                    // is when we are doing a redirect sign in flow.
                    throw new Error("Should not redirect.");
                case "success":
                    store.navigateToReturnUrl(store.getReturnUrl(result.state));
                    break;
                case "fail":
                    store.setMessage(result.message);
                    break;
            }
        },

        getReturnUrl(state?: SigninState) {
            const params = new URLSearchParams(window.location.search);
            const fromQuery = params.get(QueryParameterNames.ReturnUrl);
            if (
                fromQuery &&
                !fromQuery.startsWith(`${window.location.origin}/`)
            ) {
                // This is an extra check to prevent open redirects.
                throw new Error(
                    "Invalid return url. The return url needs to have the same origin as the current page."
                );
            }
            return (
                (state && state.returnUrl) ||
                fromQuery?.replace(window.location.origin, "") ||
                `${window.location.origin}/`
            );
        },
        redirectToRegister() {
            store.redirectToApiAuthorizationPath(
                `${authorizeService.applicationPaths.identityRegisterPath}?${
                    QueryParameterNames.ReturnUrl
                }=${encodeURI(authorizeService.applicationPaths.login)}`
            );
        },
        redirectToProfile() {
            store.redirectToApiAuthorizationPath(
                authorizeService.applicationPaths.identityManagePath
            );
        },
        redirectToApiAuthorizationPath(apiAuthorizationPath: string) {
            const redirectUrl = apiAuthorizationPath;
            // It's important that we do a replace here so that when the user hits the back arrow on the
            // browser he gets sent back to where it was on the app instead of to an endpoint on this
            // component.
            window.location.replace(redirectUrl);
        },

        navigateToReturnUrl(returnUrl: string) {
            // It's important that we do a replace here so that we remove the callback uri with the
            // fragment containing the tokens from the browser history.
            window.location.replace(returnUrl);
        },
    }));

    useEffect(() => {
        switch (loginAction) {
            case "login":
                store.login(store.getReturnUrl());
                break;
            case "login-callback":
                store.processLoginCallback();
                break;
            case "login-failed":
                const params = new URLSearchParams(window.location.search);
                const error = params.get(QueryParameterNames.Message);
                store.setMessage(error);
                break;
            case "profile":
                store.redirectToProfile();
                break;
            case "register":
                store.redirectToRegister();
                break;
            default:
                throw new Error(`Invalid action '${loginAction}'`);
        }
    });

    if (!!store.message) {
        return <Alert>{store.message}</Alert>;
    } else {
        switch (loginAction) {
            case "login":
                return <LinearProgress />;
            case "login-callback":
                return <LinearProgress />;
            case "profile":
            case "register":
                return <LinearProgress />;
            default:
                throw new Error(`Invalid action '${loginAction}'`);
        }
    }
});
