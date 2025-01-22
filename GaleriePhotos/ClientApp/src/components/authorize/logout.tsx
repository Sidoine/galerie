import React, { useEffect } from "react";
import {
    QueryParameterNames,
    LogoutAction,
    useAuthorize,
    SigninState,
} from "folke-service-helpers";
import { observer, useLocalObservable } from "mobx-react-lite";
import { action as mobxaction } from "mobx";
import { Alert, LinearProgress } from "@mui/material";

export interface LogoutProps {
    action: LogoutAction;
}

// The main responsibility of this component is to handle the user's logout process.
// This is the starting point for the logout process, which is usually initiated when a
// user clicks on the logout button on the LoginMenu component.
function Logout({ action }: LogoutProps) {
    const authorizeService = useAuthorize();

    const store = useLocalObservable(() => ({
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
                        store.navigateToReturnUrl(returnUrl);
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

        async processFrontChannelLogout() {
            await authorizeService.completeSignOut();
            store.setReady("Vous êtes déconnecté");
        },

        getReturnUrl(state?: SigninState) {
            if (state && state.returnUrl) return state.returnUrl;

            const params = new URLSearchParams(window.location.search);
            const fromQuery = params.get(QueryParameterNames.ReturnUrl);
            if (fromQuery) {
                if (!fromQuery.startsWith(`${window.location.origin}/`)) {
                    // This is an extra check to prevent open redirects.
                    throw new Error(
                        "Invalid return url. The return url needs to have the same origin as the current page."
                    );
                }
                return fromQuery.replace(window.location.origin, "");
            }
            return authorizeService.applicationPaths.loggedOut;
        },

        navigateToReturnUrl(returnUrl: string) {
            window.location.href = returnUrl;
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
                store.logout(store.getReturnUrl());
                break;
            case "logout-callback":
                store.processLogoutCallback();
                break;
            case "front-channel-logged-out":
                store.processFrontChannelLogout();
                break;
            default:
                throw new Error(`Invalid action '${action}'`);
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
                return <LinearProgress />;
            case "logout-callback":
                return <LinearProgress />;
            case "front-channel-logged-out":
                return <Alert severity="success">{store.message}</Alert>;
            default:
                return <Alert severity="error">Invalid action {action}</Alert>;
        }
    }
}

export default observer(Logout);
