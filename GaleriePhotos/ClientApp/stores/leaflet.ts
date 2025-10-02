/* eslint-disable @typescript-eslint/no-require-imports */
// Correction des URLs d'icônes Leaflet : par défaut Leaflet génère des chemins relatifs (ex: gallery/1/photos/images/marker-icon.png)
// Ce bloc force l'utilisation des assets packagés via le bundler afin d'avoir des URLs absolues correctes.
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;

const iconUrl = require("leaflet/dist/images/marker-icon.png").uri;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png").uri,
  iconUrl,
  shadowUrl: require("leaflet/dist/images/marker-shadow.png").uri,
});
