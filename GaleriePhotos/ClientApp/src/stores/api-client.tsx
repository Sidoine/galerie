import { SimpleApiClient } from "folke-service-helpers";
import { createContext, useContext, useMemo } from "react";

const ApiClientContext = createContext<SimpleApiClient | null>(null);

export function ApiClientProvider({ children }: { children: React.ReactNode }) {
    const apiClient = useMemo(() => new SimpleApiClient(null), []);
    return (
        <ApiClientContext.Provider value={apiClient}>
            {children}
        </ApiClientContext.Provider>
    );
}

export function useApiClient() {
    const apiClient = useContext(ApiClientContext);
    if (!apiClient) throw new Error("No ApiClientContext provided");
    return apiClient;
}
