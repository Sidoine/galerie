import { test, expect } from "@playwright/test";
import { registerApiMocks } from "./helpers/apiMocks.ts";

const galleryId = 1;
const rootDirectoryId = 10;

const mockUser = {
  id: "user-1",
  name: "Alice",
  administrator: true,
};

const mockGalleries = [
  {
    id: galleryId,
    name: "Famille 2024",
    rootDirectoryId,
    numberOfPhotos: 3,
    coverPhotoId: "cover-1",
  },
];

const mockGalleryFull = {
  minDate: "2024-01-01T00:00:00Z",
  maxDate: "2024-12-31T23:59:59Z",
  id: galleryId,
  name: "Famille 2024",
  rootDirectoryId,
  numberOfPhotos: 3,
  coverPhotoId: null,
};

const mockPhotos = Array.from({ length: 3 }, (_, index) => {
  const id = 101 + index;
  return {
    id,
    publicId: `photo-${id}`,
    name: `Photo ${index + 1}`,
    video: false,
    directoryId: rootDirectoryId,
    dateTime: new Date(Date.UTC(2024, 0, index + 1, 12, 0, 0)).toISOString(),
    place: null,
  };
});

const mockMembers = [
  {
    id: 1,
    galleryId,
    galleryName: "Famille 2024",
    userId: mockUser.id,
    userName: mockUser.name,
    directoryVisibility: 1,
    isAdministrator: true,
  },
];

const mockVisibilities = [
  {
    id: 1,
    galleryId,
    name: "Famille",
    icon: "family",
    value: 1,
  },
];

const rootDirectorySummary = {
  id: rootDirectoryId,
  visibility: 1,
  name: "Tous les albums",
  coverPhotoId: null,
  numberOfPhotos: mockPhotos.length,
  numberOfSubDirectories: 1,
};

const childDirectoryId = 20;
const childDirectorySummary = {
  id: childDirectoryId,
  visibility: 1,
  name: "Vacances Bretagne",
  coverPhotoId: null,
  numberOfPhotos: 0,
  numberOfSubDirectories: 0,
};

const mockDirectories = {
  infoById: {
    [rootDirectoryId]: {
      ...rootDirectorySummary,
      parent: null,
      minDate: mockPhotos[0]!.dateTime,
      maxDate: mockPhotos[mockPhotos.length - 1]!.dateTime,
    },
    [childDirectoryId]: {
      ...childDirectorySummary,
      parent: rootDirectorySummary,
      minDate: mockPhotos[0]!.dateTime,
      maxDate: mockPhotos[mockPhotos.length - 1]!.dateTime,
    },
  },
  subDirectoriesById: {
    [rootDirectoryId]: [childDirectorySummary],
    [childDirectoryId]: [],
  },
  photosByDirectoryId: {
    [rootDirectoryId]: mockPhotos,
    [childDirectoryId]: [],
  },
};

test.describe("Drawer history", () => {
  test.beforeEach(async ({ page }) => {
    await registerApiMocks(page, {
      galleryId,
      user: mockUser,
      galleries: mockGalleries,
      gallery: mockGalleryFull,
      galleryPhotos: mockPhotos,
      members: mockMembers,
      visibilities: mockVisibilities,
      directories: mockDirectories,
    });
  });

  test("adds a browser history entry when navigating via drawer", async ({
    page,
  }) => {
    await page.goto(`/gallery/${galleryId}`);
    await expect(page).toHaveURL(new RegExp(`/gallery/${galleryId}(\\?.*)?$`));

    const albumsButton = page.getByRole("button", { name: /Albums/ }).first();
    await expect(albumsButton).toBeVisible();
    await albumsButton.click();

    await page.waitForURL(`**/gallery/${galleryId}/directory`);

    await page.goBack();
    await page.waitForURL(new RegExp(`/gallery/${galleryId}(\\?.*)?$`));
    await expect(
      page.getByPlaceholder("Rechercher dans vos photos"),
    ).toBeVisible();
  });
});
