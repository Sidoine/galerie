import { observer } from "mobx-react-lite";
import React from "react";
import {
    IndexRouteProps,
    LayoutRouteProps,
    PathRouteProps,
    Route,
} from "react-router";
import { RedirectOrRender } from "./redirect-or-render";

export const AuthorizeRoute = observer(function AuthorizeRoute({
    element,
    ...props
}: PathRouteProps | LayoutRouteProps | IndexRouteProps) {
    return (
        <Route
            {...props}
            element={<RedirectOrRender>{element}</RedirectOrRender>}
        />
    );
});
