import React, { useEffect } from "react";
import { SigninState } from "../../stores/authorize";
import {
    QueryParameterNames,
    ApplicationPaths,
    LogoutAction,
} from "../../stores/authorize";
import { observer, useLocalStore } from "mobx-react-lite";
import { useStores } from "../../stores";
import { action as mobxaction } from "mobx";
import { Alert } from "@material-ui/lab";

export interface LogoutProps {
    action: LogoutAction;
}

// The main responsibility of this component is to handle the user's logout process.
// This is the starting point for the logout process, which is usually initiated when a
// user clicks on the logout button on the LoginMenu component.
export const Logout = observer(({ action }: LogoutProps) => {
    const { authorizeService } = useStores();

    const store = useLocalStore(() => ({
        message: null as null | string,
        async logout(returnUrl: string) {
            const state = { returnUrl };
            const isauthenticated = await authorizeService.getAccessToken();
            if (isauthenticated) {
                const result = await authorizeService.signOut(state);
                switch (result.status) {
                    case "redirect":
                        break;
                    case "success":
                        await store.navigateToReturnUrl(returnUrl);
                        break;
                    case "fail":
                        store.message = result.message;
                        break;
                    default:
                        throw new Error(
                            "Invalid authentication result status."
                        );
                }
            } else {
                store.message = "You successfully logged out!";
            }
        },

        async processLogoutCallback() {
            const url = window.location.href;
            const result = await authorizeService.completeSignOut(url);
            switch (result.status) {
                case "redirect":
                    // There should not be any redirects as the only time completeAuthentication finishes
                    // is when we are doing a redirect sign in flow.
                    throw new Error("Should not redirect.");
                case "success":
                    store.navigateToReturnUrl(store.getReturnUrl(result.state));
                    break;
                case "fail":
                    store.message = result.message;
                    break;
                default:
                    throw new Error("Invalid authentication result status.");
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
                fromQuery ||
                `${window.location.origin}${ApplicationPaths.LoggedOut}`
            );
        },

        navigateToReturnUrl(returnUrl: string) {
            return window.location.replace(returnUrl);
        },
        setReady: mobxaction((message: string) => {
            store.message = message;
            store.isReady = true;
        }),
        isReady: false,
    }));

    useEffect(() => {
        switch (action) {
            case "logout":
                if (!!window.history.state.state.local) {
                    store.logout(store.getReturnUrl());
                } else {
                    // This prevents regular links to <app>/authentication/logout from triggering a logout
                    store.setReady(
                        "The logout was not initiated from within the page."
                    );
                }
                break;
            case "logout-callback":
                store.processLogoutCallback();
                break;
            case "logged-out":
                store.setReady("Vous êtes déconnecté");
                break;
            default:
                throw new Error(`Action invalide '${action}'`);
        }
    });

    const isReady = authorizeService.ready;
    if (!isReady) {
        return <div></div>;
    }
    if (!!store.message) {
        return <Alert severity="success">{store.message}</Alert>;
    } else {
        switch (action) {
            case "logout":
                return <Alert severity="info">Déconnexion en cours</Alert>;
            case "logout-callback":
                return <Alert severity="info">Retour de déconnexion</Alert>;
            case "logged-out":
                return <Alert severity="success">{store.message}</Alert>;
            default:
                return (
                    <Alert severity="error">Invalid action '${action}</Alert>
                );
        }
    }
});
