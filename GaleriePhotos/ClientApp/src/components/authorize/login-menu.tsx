import React, { Fragment, ReactNode, useCallback } from "react";
import { Link } from "react-router-dom";
import { observer } from "mobx-react-lite";
import AccountCircle from "@mui/icons-material/AccountCircle";
import { IconButton, Menu, MenuItem } from "@mui/material";
import { useAuthorize } from "folke-service-helpers";

function LoginDropdown({ children }: { children: ReactNode }) {
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
        null
    );
    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) =>
            setAnchorEl(e.currentTarget),
        []
    );
    const handleClose = useCallback(() => setAnchorEl(null), []);
    return (
        <Fragment>
            <IconButton onClick={handleClick}>
                <AccountCircle />
            </IconButton>
            <Menu
                open={anchorEl !== null}
                anchorEl={anchorEl}
                anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
                onClose={handleClose}
            >
                {children}
            </Menu>
        </Fragment>
    );
}

function AuthenticatedView({
    profilePath,
    userName,
    logoutPath,
}: {
    userName: string | null | undefined;
    profilePath: string;
    logoutPath: { pathname: string; state: { local: boolean } };
}) {
    return (
        <LoginDropdown>
            <MenuItem component={Link} to={profilePath}>
                {userName}
            </MenuItem>
            <MenuItem component={Link} to={logoutPath}>
                Déconnexion
            </MenuItem>
        </LoginDropdown>
    );
}

function AnonymousView({
    registerPath,
    loginPath,
}: {
    registerPath: string;
    loginPath: string;
}) {
    return (
        <LoginDropdown>
            <MenuItem component={Link} to={registerPath}>
                S&apos;enregistrer
            </MenuItem>
            <MenuItem component={Link} to={loginPath}>
                Connexion
            </MenuItem>
        </LoginDropdown>
    );
}

export const LoginMenu = observer(function LoginMenu() {
    const authorizeService = useAuthorize();
    const isAuthenticated = authorizeService.authenticated;
    const userName =
        authorizeService.user && authorizeService.user.profile.name;
    if (!isAuthenticated) {
        const registerPath = authorizeService.applicationPaths.register;
        const loginPath = authorizeService.applicationPaths.login;
        return (
            <AnonymousView registerPath={registerPath} loginPath={loginPath} />
        );
    } else {
        const profilePath = authorizeService.applicationPaths.profile;
        const logoutPath = {
            pathname: authorizeService.applicationPaths.logOut,
            state: { local: true },
        };
        return (
            <AuthenticatedView
                userName={userName}
                profilePath={profilePath}
                logoutPath={logoutPath}
            />
        );
    }
});
