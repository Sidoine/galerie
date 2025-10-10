import { Place } from "@/services/views";

export interface PlacesMapProps {
  selectedCountry: Place | null;
  placesToShow: Place[];
  onClickPlace: (placeId: number) => void;
  onClickPhotos: (placeId: number) => void;
}
