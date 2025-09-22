// Centralisation des types de paramètres de navigation React Navigation

export type OrderType = "date-desc" | "date-asc";

export type MainStackParamList = {
  GalleryChooser: undefined;
  Settings: undefined;
  Gallery: { galleryId: number };
};

export type GalleryStackParamList = {
  RootDirectory: { galleryId: number };
  Directory: { galleryId: number; directoryId: number; order: OrderType };
  Photo: {
    galleryId: number;
    directoryId: number;
    photoId: number;
    order: OrderType;
  };
  FaceNames: { galleryId: number };
  FaceNamePhotos: { galleryId: number; faceNameId: number };
  GalleryMembers: { galleryId: number };
  DirectoryVisibilitySettings: { galleryId: number };
  GallerySettings: { galleryId: number };
};

export type SettingsStackParamList = {
  Users: undefined;
  Galleries: undefined;
};
