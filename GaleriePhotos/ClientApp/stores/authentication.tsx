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
  token: string | null;
  setToken: (token: string | null) => Promise<void>;
  authenticate: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
}

const AuthenticationContext = createContext<AuthenticationProps | null>(null);

export const AuthenticationStoreProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [token, setTokenState] = useState<string | null>(null);
  const setToken = async (newToken: string | null) => {
    if (newToken) {
      await SecureStore.setItemAsync("authToken", newToken);
    } else {
      await SecureStore.deleteItemAsync("authToken");
    }
    setTokenState(newToken);
  };

  useEffect(() => {
    (async () => {
      if (!(await SecureStore.isAvailableAsync())) {
        setTokenState("cookie");
        return;
      }

      const storedToken = await SecureStore.getItemAsync("authToken");
      if (storedToken) {
        setTokenState(storedToken);
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
        const data = JSON.parse(text);
        setToken(data.accessToken);
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
        token,
        setToken,
        authenticate,
        register,
        identifier: token && token !== "cookie" ? token : null,
        authorizationHeader:
          token && token !== "cookie" ? `Bearer ${token}` : null,
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
