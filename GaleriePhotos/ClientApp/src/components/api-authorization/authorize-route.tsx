import React, { Component, ReactElement } from "react";
import { Route, Redirect, RouteComponentProps } from "react-router-dom";
import { ApplicationPaths, QueryParameterNames } from "../../stores/authorize";
import { useStores } from "../../stores";
import { Observer } from "mobx-react-lite";

export interface AuthorizeRouteProps<
  Params extends { [K in keyof Params]?: string } = {}
> {
  component?: typeof Component;
  path: string;
  exact?: boolean;
  render?: (props: RouteComponentProps<Params>) => ReactElement;
}

interface ReadirectOrRenderProps<
  Params extends { [K in keyof Params]?: string } = {}
> {
  props: RouteComponentProps<Params>;
  redirectUrl: string;
  render?: (props: RouteComponentProps<Params>) => ReactElement;
  component?: typeof Component;
}

function RedirectOrRender<
  Params extends { [K in keyof Params]?: string } = {}
>({
  props,
  redirectUrl,
  component: Component,
  render
}: ReadirectOrRenderProps<Params>) {
  const { authorizeService } = useStores();
  return (
    <Observer>
      {() => (
        <>
          {authorizeService.authenticated && Component && (
            <Component {...props} />
          )}
          {authorizeService.authenticated && render && render(props)}
          {!authorizeService.authenticated && <Redirect to={redirectUrl} />}
        </>
      )}
    </Observer>
  );
}

function AuthorizeRoute<Params extends { [K in keyof Params]?: string } = {}>({
  component,
  render,
  exact,
  path
}: AuthorizeRouteProps<Params>) {
  const { authorizeService } = useStores();

  const redirectUrl = `${ApplicationPaths.Login}?${
    QueryParameterNames.ReturnUrl
  }=${encodeURI(window.location.href)}`;

  return (
    <Observer>
      {() => (
        <>
          {!authorizeService.ready && <div>Loading</div>}
          {authorizeService.ready && (
            <Route
              exact={exact}
              path={path}
              render={props => (
                <RedirectOrRender
                  redirectUrl={redirectUrl}
                  props={props}
                  component={component}
                  render={render}
                />
              )}
            />
          )}
        </>
      )}
    </Observer>
  );
}

export default AuthorizeRoute;
