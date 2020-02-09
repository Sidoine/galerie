import React, { Fragment } from "react";
import { Link } from "react-router-dom";
import { ApplicationPaths } from "../../stores/authorize";
import { useStores } from "../../stores";
import { observer } from "mobx-react-lite";

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
    <Fragment>
      <Link className="text-dark" to={profilePath}>
        Hello {userName}
      </Link>
      <Link className="text-dark" to={logoutPath}>
        Logout
      </Link>
    </Fragment>
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
    <Fragment>
      <Link className="text-dark" to={registerPath}>
        Register
      </Link>
      <Link className="text-dark" to={loginPath}>
        Login
      </Link>
    </Fragment>
  );
}

export const LoginMenu = observer(() => {
  const { authorizeService } = useStores();
  const isAuthenticated = authorizeService.authenticated;
  const userName = authorizeService.user && authorizeService.user.profile.name;
  if (!isAuthenticated) {
    const registerPath = `${ApplicationPaths.Register}`;
    const loginPath = `${ApplicationPaths.Login}`;
    return <AnonymousView registerPath={registerPath} loginPath={loginPath} />;
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
