// @ts-nocheck
import { test, expect } from "@playwright/test";
import { registerApiMocks } from "./helpers/apiMocks";

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
    numberOfPhotos: 2,
    coverPhotoId: "cover-1",
  },
];

const mockGalleryFull = {
  minDate: "2024-01-01T00:00:00Z",
  maxDate: "2024-12-31T23:59:59Z",
  id: galleryId,
  name: "Famille 2024",
  rootDirectoryId,
  numberOfPhotos: 2,
  coverPhotoId: null,
};

const mockPhotos = [
  {
    id: 101,
    publicId: "photo-101",
    name: "Coucher de soleil",
    video: false,
    directoryId: rootDirectoryId,
    dateTime: "2024-08-14T19:30:00Z",
    place: {
      id: 1,
      name: "Paris",
    },
  },
  {
    id: 102,
    publicId: "photo-102",
    name: "Randonnée",
    video: false,
    directoryId: rootDirectoryId,
    dateTime: "2024-07-01T09:15:00Z",
    place: {
      id: 2,
      name: "Alpes",
    },
  },
];

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

test.describe("Gallery page", () => {
  test.beforeEach(async ({ page }) => {
    await registerApiMocks(page, {
      galleryId,
      user: mockUser,
      galleries: mockGalleries,
      gallery: mockGalleryFull,
      galleryPhotos: mockPhotos,
      members: mockMembers,
      visibilities: mockVisibilities,
    });
  });

  test("renders gallery overview", async ({ page }) => {
    await page.goto(`/gallery/${galleryId}`);

    await expect(
      page.getByPlaceholder("Rechercher dans vos photos")
    ).toBeVisible();
    await expect(page.getByText("Photos", { exact: true })).toBeVisible();

    const photoLinks = page.locator('a[href*="/photos/"]');
    await expect(photoLinks).toHaveCount(mockPhotos.length);
  });

  test("navigates to search results", async ({ page }) => {
    await page.goto(`/gallery/${galleryId}`);

    const searchInput = page.getByPlaceholder("Rechercher dans vos photos");
    await searchInput.fill("montagne");
    await searchInput.press("Enter");

    await page.waitForURL(`**/gallery/${galleryId}/search?query=montagne`);
  });

  test("supports sorting oldest first", async ({ page }) => {
    await page.goto(`/gallery/${galleryId}`);

    await page.getByText("Plus ancien en premier").click();

    await page.waitForURL(`**/gallery/${galleryId}?order=date-asc`);
  });
});
