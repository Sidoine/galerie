import { ValueLoader } from "folke-service-helpers";
import { Directory, Photo } from "../services/views";

export class DirectoriesStore {
  constructor(
    public loader: ValueLoader<Directory[], string | null>,
    public contentLoader: ValueLoader<Photo[], string | null>
  ) {}
}
