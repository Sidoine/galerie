import Constants from "expo-constants";

export function getBackendUrl() {
  const uri = Constants.expoConfig?.hostUri?.split(":")[0] || "localhost";
  return `http://${uri}:6009`;
}
