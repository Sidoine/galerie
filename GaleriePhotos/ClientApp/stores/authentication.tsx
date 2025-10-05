import * as SecureStore from "expo-secure-store";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { UserStore } from "folke-service-helpers";
import { getBackendUrl } from "./config";

export interface AuthenticationProps extends UserStore {
  authenticated: boolean;
  loading: boolean;
  authenticate: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearCredentials: () => void;
}

interface BearerToken {
  tokenType: "Bearer";
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
}

interface StoredCookie {
  tokenType: "cookie";
}

interface StoredBearerToken {
  tokenType: "Bearer";
  accessToken: string;
  expiresAt: number;
  refreshToken: string;
}

type StoredToken = StoredCookie | StoredBearerToken;

const AuthenticationContext = createContext<AuthenticationProps | null>(null);

export const AuthenticationStoreProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [token, setToken] = useState<StoredToken | null>(null);
  const [loading, setLoading] = useState(true);
  const updateToken = useCallback(async (newToken: BearerToken | null) => {
    if (newToken) {
      const newTokenState: StoredBearerToken = {
        tokenType: "Bearer",
        accessToken: newToken.accessToken,
        expiresAt: Date.now() + newToken.expiresIn * 1000,
        refreshToken: newToken.refreshToken,
      };
      if (await SecureStore.isAvailableAsync()) {
        await SecureStore.setItemAsync(
          "authToken",
          JSON.stringify(newTokenState)
        );
      }
      setToken(newTokenState);
    } else {
      if (await SecureStore.isAvailableAsync()) {
        await SecureStore.deleteItemAsync("authToken");
      }
      setToken(null);
    }
  }, []);

  const refreshToken = useCallback(
    async (refreshToken: string) => {
      const response = await fetch(`${getBackendUrl()}/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: refreshToken }),
      });

      if (response.ok) {
        const data = (await response.json()) as BearerToken;
        updateToken(data);
      } else {
        updateToken(null);
      }
    },
    [updateToken]
  );

  useEffect(() => {
    // Create a time out to refresh the token a bit before it expires
    if (token && token.tokenType === "Bearer") {
      const timeout = token.expiresAt - Date.now();
      const id = setTimeout(() => {
        refreshToken(token.refreshToken);
      }, Math.max(10_000, timeout));
      return () => clearTimeout(id);
    }
  }, [refreshToken, token]);

  useEffect(() => {
    (async () => {
      if (token) return;
      setLoading(true);
      if (!(await SecureStore.isAvailableAsync())) {
        const state = localStorage.getItem("authToken");
        if (state) {
          setToken(JSON.parse(state) as StoredCookie);
        }
        setLoading(false);
        return;
      }

      const storedToken = await SecureStore.getItemAsync("authToken");
      if (storedToken) {
        try {
          const parsedStoredToken: StoredToken = JSON.parse(storedToken);

          if (parsedStoredToken.tokenType === "Bearer") {
            if (parsedStoredToken.expiresAt > Date.now()) {
              setToken(parsedStoredToken);
            } else {
              await refreshToken(parsedStoredToken.refreshToken);
            }
          } else if (parsedStoredToken.tokenType === "cookie") {
            setToken(parsedStoredToken);
          }
        } catch {
          await SecureStore.deleteItemAsync("authToken");
        }
      }
      setLoading(false);
    })();
  }, [refreshToken, token]);

  const authenticate = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const useCookies = !(await SecureStore.isAvailableAsync());
      let url = `${getBackendUrl()}/login`;
      if (useCookies) {
        url += "?useCookies=true";
      }
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        if (useCookies) {
          setToken({ tokenType: "cookie" });
          localStorage.setItem(
            "authToken",
            JSON.stringify({ tokenType: "cookie" })
          );
        } else {
          const text = await response.text();
          const data = JSON.parse(text) as BearerToken;
          updateToken(data);
        }
        return true;
      }
      return false;
    },
    [updateToken]
  );

  const register = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const response = await fetch(`${getBackendUrl()}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      return response.ok;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await fetch(`${getBackendUrl()}/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && token.tokenType === "Bearer"
            ? { Authorization: `Bearer ${token.accessToken}` }
            : {}),
        },
        body: JSON.stringify({}),
      });
    } catch (error) {
      // Ignore network errors, still clear local token
      console.warn("Logout request failed:", error);
    }

    // Clear stored token regardless of API response
    await updateToken(null);
  }, [token, updateToken]);

  const clearCredentials = useCallback(async () => {
    setToken(null);
    if (await SecureStore.isAvailableAsync()) {
      await SecureStore.deleteItemAsync("authToken");
    } else {
      localStorage.removeItem("authToken");
    }
  }, []);

  return (
    <AuthenticationContext.Provider
      value={{
        authenticated: !!token,
        clearCredentials,
        authenticate,
        register,
        logout,
        identifier:
          token && token.tokenType === "Bearer" ? token.accessToken : null,
        authorizationHeader:
          token && token.tokenType === "Bearer"
            ? `Bearer ${token.accessToken}`
            : null,
        loading,
      }}
    >
      {children}
    </AuthenticationContext.Provider>
  );
};

export function useAuthenticationStore() {
  const context = useContext(AuthenticationContext);
  if (!context) {
    throw new Error(
      "useAuthenticationStore must be used within an AuthenticationStoreProvider"
    );
  }
  return context;
}
