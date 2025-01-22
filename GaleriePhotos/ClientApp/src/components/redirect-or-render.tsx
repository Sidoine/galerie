import React, { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { observer } from "mobx-react-lite";
import { LinearProgress } from "@mui/material";
import { QueryParameterNames, useAuthorize } from "folke-service-helpers";

interface RedirectOrRenderProps {
    children?: ReactNode;
}

export const RedirectOrRender = observer(function RedirectOrRender({
    children,
}: RedirectOrRenderProps) {
    return <>{children}</>;
});
