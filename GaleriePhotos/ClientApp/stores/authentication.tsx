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
  authenticate: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
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
  const [token, setTokenState] = useState<StoredToken | null>(null);
  const setToken = async (newToken: BearerToken | null) => {
    if (newToken) {
      await SecureStore.setItemAsync("authToken", JSON.stringify(newToken));
      setTokenState({
        tokenType: "Bearer",
        accessToken: newToken.accessToken,
        expiresAt: Date.now() + newToken.expiresIn * 1000,
        refreshToken: newToken.refreshToken,
      });
    } else {
      await SecureStore.deleteItemAsync("authToken");
      setTokenState(null);
    }
  };

  useEffect(() => {
    if (token && token.tokenType === "Bearer") {
      const timeout = token.expiresAt - Date.now();
      const id = setTimeout(() => {
        refreshToken();
      }, Math.max(0, timeout));
      return () => clearTimeout(id);
    }
  }, [token]);

  const refreshToken = useCallback(async () => {
    if (token && token.tokenType === "Bearer") {
      const response = await fetch(`${getBackendUrl()}/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: token.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data);
      }
    }
  }, [token, setToken]);

  useEffect(() => {
    (async () => {
      if (!(await SecureStore.isAvailableAsync())) {
        setTokenState({ tokenType: "cookie" });
        return;
      }

      const storedToken = await SecureStore.getItemAsync("authToken");
      if (storedToken) {
        try {
          const parsedStoredToken: StoredToken = JSON.parse(storedToken);
          if (parsedStoredToken.tokenType === "Bearer") {
            if (parsedStoredToken.expiresAt > Date.now()) {
              setTokenState(parsedStoredToken);
            } else {
              await refreshToken();
            }
          } else if (parsedStoredToken.tokenType === "cookie") {
            setTokenState(parsedStoredToken);
          }
        } catch {}
      }
    })();
  }, []);

  const authenticate = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      // Remplacez cette URL par l'endpoint réel de votre API
      console.log(`${getBackendUrl()}/login`);
      const response = await fetch(`${getBackendUrl()}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, useCookies: false }),
      });

      if (response.ok) {
        const text = await response.text();
        const data = JSON.parse(text) as BearerToken;
        setToken(data);
        console.log("Authenticated, token set", data.accessToken);
        return true;
      }
      return false;
    },
    [setToken]
  );

  const register = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const response = await fetch(`${getBackendUrl()}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: email, password }),
      });
      return response.ok;
    },
    []
  );

  return (
    <AuthenticationContext.Provider
      value={{
        authenticated: !!token,
        authenticate,
        register,
        identifier:
          token && token.tokenType === "Bearer" ? token.accessToken : null,
        authorizationHeader:
          token && token.tokenType === "Bearer"
            ? `Bearer ${token.accessToken}`
            : null,
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
