import {
  UserManager,
  WebStorageStateStore,
  User as OidcUser
} from "oidc-client";
import { UserManager as ApiUserManager } from "folke-service-helpers";
import { observable, computed, action } from "mobx";

export const ApplicationName = "GaleriePhotos";

export const QueryParameterNames = {
  ReturnUrl: "returnUrl",
  Message: "message"
};

const LogoutActions = {
  LogoutCallback: "logout-callback",
  Logout: "logout",
  LoggedOut: "logged-out"
};

export type LogoutAction = "logout-callback" | "logout" | "logged-out";

const LoginActions = {
  Login: "login",
  LoginCallback: "login-callback",
  LoginFailed: "login-failed",
  Profile: "profile",
  Register: "register"
};

export type LoginAction =
  | "login"
  | "login-callback"
  | "login-failed"
  | "profile"
  | "register";

const prefix = "/authentication";

export const ApplicationPaths = {
  DefaultLoginRedirectPath: "/",
  ApiAuthorizationClientConfigurationUrl: `/_configuration/${ApplicationName}`,
  ApiAuthorizationPrefix: prefix,
  Login: `${prefix}/${LoginActions.Login}`,
  LoginFailed: `${prefix}/${LoginActions.LoginFailed}`,
  LoginCallback: `${prefix}/${LoginActions.LoginCallback}`,
  Register: `${prefix}/${LoginActions.Register}`,
  Profile: `${prefix}/${LoginActions.Profile}`,
  LogOut: `${prefix}/${LogoutActions.Logout}`,
  LoggedOut: `${prefix}/${LogoutActions.LoggedOut}`,
  LogOutCallback: `${prefix}/${LogoutActions.LogoutCallback}`,
  IdentityRegisterPath: "/Identity/Account/Register",
  IdentityManagePath: "/Identity/Account/Manage"
};

interface UserProfile {
  name: string;
}

interface User extends OidcUser {
  profile: UserProfile;
}

export interface SigninState {
  returnUrl: string;
}

type CallbackFunction = () => void;

interface Callback {
  callback: CallbackFunction;
  subscription: number;
}

type ReturnStatus =
  | { status: "fail"; message: string }
  | { status: "success"; state: SigninState }
  | { status: "redirect" };

export class AuthorizeService implements ApiUserManager {
  _callbacks: Callback[] = [];
  _nextSubscriptionId = 0;
  @observable
  public user: User | null = null;
  @observable
  public authenticated = false;
  @observable
  public ready = false;
  userManager?: UserManager;

  // By default pop ups are disabled because they don't work properly on Edge.
  // If you want to enable pop up authentication simply set this flag to false.
  _popUpDisabled = true;

  constructor() {
    this.getUser();
  }

  private async getUser() {
    if (this.user) return this.user;
    const userManager = await this.ensureUserManagerInitialized();
    this.updateState(await userManager.getUser());
    return this.user;
  }

  // async getUserProfile(): Promise<UserProfile | null> {
  //     const user = await this.getUser();
  //     return user && user.profile;
  // }

  async getAccessToken() {
    const user = await this.getUser();
    return user && user.access_token;
  }

  @computed
  get authorizationHeader() {
    return this.user && `Bearer ${this.user.access_token}`;
  }

  async getAuthorizationHeader() {
    await this.getUser();
    return this.authorizationHeader;
  }

  // We try to authenticate the user in three different ways:
  // 1) We try to see if we can authenticate the user silently. This happens
  //    when the user is already logged in on the IdP and is done using a hidden iframe
  //    on the client.
  // 2) We try to authenticate the user using a PopUp Window. This might fail if there is a
  //    Pop-Up blocker or the user has disabled PopUps.
  // 3) If the two methods above fail, we redirect the browser to the IdP to perform a traditional
  //    redirect flow.
  async signIn(state: SigninState) {
    const userManager = await this.ensureUserManagerInitialized();
    try {
      const silentUser = await userManager.signinSilent(this.createArguments());
      this.updateState(silentUser);
      return this.success(state);
    } catch (silentError) {
      // User might not be authenticated, fallback to popup authentication
      console.log("Silent authentication error: ", silentError);

      try {
        if (this._popUpDisabled) {
          throw new Error(
            "Popup disabled. Change 'AuthorizeService.js:AuthorizeService._popupDisabled' to false to enable it."
          );
        }

        const popUpUser = await userManager.signinPopup(this.createArguments());
        this.updateState(popUpUser);
        return this.success(state);
      } catch (popUpError) {
        if (popUpError.message === "Popup window closed") {
          // The user explicitly cancelled the login action by closing an opened popup.
          return this.error("The user closed the window.");
        } else if (!this._popUpDisabled) {
          console.log("Popup authentication error: ", popUpError);
        }

        // PopUps might be blocked by the user, fallback to redirect
        try {
          await userManager.signinRedirect(this.createArguments(state));
          return this.redirect();
        } catch (redirectError) {
          console.log("Redirect authentication error: ", redirectError);
          return this.error(redirectError);
        }
      }
    }
  }

  async completeSignIn(url: string) {
    try {
      const userManager = await this.ensureUserManagerInitialized();
      const user = await userManager.signinCallback(url);
      this.updateState(user);
      return this.success(user && user.state);
    } catch (error) {
      console.log("There was an error signing in: ", error);
      return this.error("There was an error signing in.");
    }
  }

  // We try to sign out the user in two different ways:
  // 1) We try to do a sign-out using a PopUp Window. This might fail if there is a
  //    Pop-Up blocker or the user has disabled PopUps.
  // 2) If the method above fails, we redirect the browser to the IdP to perform a traditional
  //    post logout redirect flow.
  async signOut(state: SigninState) {
    const userManager = await this.ensureUserManagerInitialized();
    try {
      if (this._popUpDisabled) {
        throw new Error(
          "Popup disabled. Change 'AuthorizeService.js:AuthorizeService._popupDisabled' to false to enable it."
        );
      }

      await userManager.signoutPopup(this.createArguments());
      this.updateState(null);
      return this.success(state);
    } catch (popupSignOutError) {
      console.log("Popup signout error: ", popupSignOutError);
      try {
        await userManager.signoutRedirect(this.createArguments(state));
        return this.redirect();
      } catch (redirectSignOutError) {
        console.log("Redirect signout error: ", redirectSignOutError);
        return this.error(redirectSignOutError);
      }
    }
  }

  async completeSignOut(url: string) {
    const userManager = await this.ensureUserManagerInitialized();
    try {
      const response = await userManager.signoutCallback(url);
      this.updateState(null);
      return this.success(response && response.data);
    } catch (error) {
      console.log(`There was an error trying to log out '${error}'.`);
      return this.error(error);
    }
  }

  @action
  updateState(user: User | null) {
    this.ready = true;
    if (
      (user === null && this.user !== null) ||
      (user !== null &&
        (this.user === null || this.user.id_token !== user.id_token))
    ) {
      this.user = user;
      this.authenticated = !!this.user;
    }
  }

  createArguments(state?: SigninState) {
    return { useReplaceToNavigate: true, data: state };
  }

  error(message: string): ReturnStatus {
    return { status: "fail", message };
  }

  success(state: SigninState): ReturnStatus {
    return { status: "success", state };
  }

  redirect(): ReturnStatus {
    return { status: "redirect" };
  }

  async ensureUserManagerInitialized() {
    if (this.userManager !== undefined) {
      return this.userManager;
    }

    let response = await fetch(
      ApplicationPaths.ApiAuthorizationClientConfigurationUrl
    );
    if (!response.ok) {
      throw new Error(`Could not load settings for '${ApplicationName}'`);
    }

    let settings = await response.json();
    settings.automaticSilentRenew = true;
    settings.includeIdTokenInSilentRenew = true;
    settings.userStore = new WebStorageStateStore({
      prefix: ApplicationName
    });

    const userManager = (this.userManager = new UserManager(settings));

    this.userManager.events.addUserSignedOut(async () => {
      await userManager.removeUser();
      this.updateState(null);
    });
    return this.userManager;
  }
}

export type AuthenticationResultStatus = ReturnStatus["status"];
