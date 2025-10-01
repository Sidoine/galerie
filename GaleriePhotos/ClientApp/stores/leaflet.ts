// Correction des URLs d'icônes Leaflet : par défaut Leaflet génère des chemins relatifs (ex: gallery/1/photos/images/marker-icon.png)
// Ce bloc force l'utilisation des assets packagés via le bundler afin d'avoir des URLs absolues correctes.
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import "leaflet/dist/leaflet.css";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
