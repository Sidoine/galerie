import Constants from "expo-constants";

export function getBackendUrl() {
  const uri = Constants.expoConfig?.hostUri?.split(":")[0];
  console.log(Constants);
  if (uri) return `http://${uri}:6009`;
  return Constants.linkingUri ?? "https://galerie.sidoine.net";
}
