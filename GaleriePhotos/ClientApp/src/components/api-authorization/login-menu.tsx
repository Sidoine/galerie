import React, { Fragment, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ApplicationPaths } from "../../stores/authorize";
import { useStores } from "../../stores";
import { observer } from "mobx-react-lite";
import AccountCircle from "@material-ui/icons/AccountCircle";
import { IconButton, Menu, MenuItem } from "@material-ui/core";

function LoginDropdown({ children }: { children: ReactNode }) {
    const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(
        null
    );
    return (
        <Fragment>
            <IconButton onClick={e => setAnchorEl(e.currentTarget)}>
                <AccountCircle />
            </IconButton>
            <Menu
                open={anchorEl !== null}
                anchorEl={anchorEl}
                anchorOrigin={{
                    vertical: "top",
                    horizontal: "right"
                }}
                keepMounted
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right"
                }}
                onClose={() => setAnchorEl(null)}
            >
                {children}
            </Menu>
        </Fragment>
    );
}

function AuthenticatedView({
    profilePath,
    userName,
    logoutPath
}: {
    userName: string | null;
    profilePath: string;
    logoutPath: { pathname: string; state: { local: boolean } };
}) {
    return (
        <LoginDropdown>
            <MenuItem component={Link} to={profilePath}>
                {userName}
            </MenuItem>
            <MenuItem component={Link} to={logoutPath}>
                Logout
            </MenuItem>
        </LoginDropdown>
    );
}

function AnonymousView({
    registerPath,
    loginPath
}: {
    registerPath: string;
    loginPath: string;
}) {
    return (
        <LoginDropdown>
            <MenuItem component={Link} to={registerPath}>
                Register
            </MenuItem>
            <MenuItem component={Link} to={loginPath}>
                Login
            </MenuItem>
        </LoginDropdown>
    );
}

export const LoginMenu = observer(() => {
    const { authorizeService } = useStores();
    const isAuthenticated = authorizeService.authenticated;
    const userName =
        authorizeService.user && authorizeService.user.profile.name;
    if (!isAuthenticated) {
        const registerPath = `${ApplicationPaths.Register}`;
        const loginPath = `${ApplicationPaths.Login}`;
        return (
            <AnonymousView registerPath={registerPath} loginPath={loginPath} />
        );
    } else {
        const profilePath = `${ApplicationPaths.Profile}`;
        const logoutPath = {
            pathname: `${ApplicationPaths.LogOut}`,
            state: { local: true }
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
