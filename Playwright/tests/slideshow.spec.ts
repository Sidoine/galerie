import { test, expect } from "@playwright/test";
import { registerApiMocks } from "./helpers/apiMocks.ts";

const galleryId = 1;
const rootDirectoryId = 10;
const FACE_DETECTION_COMPLETED = 2;

const mockUser = {
  id: "user-1",
  name: "Alice",
  administrator: true,
};

const mockGalleries = [
  {
    id: galleryId,
    name: "Test Gallery",
    rootDirectoryId,
    numberOfPhotos: 5,
    coverPhotoId: "cover-1",
  },
];

const mockGalleryFull = {
  minDate: "2024-01-01T00:00:00Z",
  maxDate: "2024-12-31T23:59:59Z",
  id: galleryId,
  name: "Test Gallery",
  rootDirectoryId,
  numberOfPhotos: 5,
  coverPhotoId: null,
};

const mockPhotos = Array.from({ length: 5 }, (_, index) => {
  const id = 101 + index;
  const day = index + 1;
  const date = new Date(Date.UTC(2024, 0, day, 12, 0, 0));
  return {
    id,
    publicId: `photo-${id}`,
    name: `Photo ${index + 1}`,
    video: false,
    directoryId: rootDirectoryId,
    dateTime: date.toISOString(),
    place: null,
  };
});

const photoDetailsById = Object.fromEntries(
  mockPhotos.map((photo, index, array) => [
    photo.id,
    {
      ...photo,
      nextId: index < array.length - 1 ? array[index + 1]!.id : null,
      previousId: index > 0 ? array[index - 1]!.id : null,
      latitude: null,
      longitude: null,
      camera: null,
      private: false,
      faceDetectionStatus: FACE_DETECTION_COMPLETED,
    },
  ])
);

const mockMembers = [
  {
    id: 1,
    galleryId,
    galleryName: "Test Gallery",
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
    name: "Public",
    icon: "public",
    value: 1,
  },
];

const rootDirectorySummary = {
  id: rootDirectoryId,
  visibility: 1,
  name: "Root",
  coverPhotoId: null,
  numberOfPhotos: 5,
  numberOfSubDirectories: 0,
};

const mockRootDirectoryFull = {
  ...rootDirectorySummary,
  parent: null,
  minDate: mockPhotos[0]!.dateTime,
  maxDate: mockPhotos[mockPhotos.length - 1]!.dateTime,
};

const mockDirectories = {
  infoById: {
    [rootDirectoryId]: mockRootDirectoryFull,
  },
  subDirectoriesById: {
    [rootDirectoryId]: [],
  },
  photosByDirectoryId: {
    [rootDirectoryId]: mockPhotos,
  },
};

test.describe("Slideshow feature", () => {
  test.beforeEach(async ({ page }) => {
    await registerApiMocks(page, {
      galleryId,
      user: mockUser,
      galleries: mockGalleries,
      gallery: mockGalleryFull,
      galleryPhotos: mockPhotos,
      members: mockMembers,
      visibilities: mockVisibilities,
      photoDetailsById,
      directories: mockDirectories,
    });
  });

  test("shows slideshow button in header when photos are available", async ({
    page,
  }) => {
    await page.goto(`/gallery/${galleryId}`);

    // Wait for photos to load
    const photoLinks = page.locator('a[href*="/photos/"]');
    await expect(photoLinks.first()).toBeVisible();

    // Check for slideshow button
    const slideshowButton = page.getByLabel("Lancer le diaporama");
    await expect(slideshowButton).toBeVisible();
  });

  test("navigates to slideshow when button is clicked", async ({ page }) => {
    await page.goto(`/gallery/${galleryId}`);

    // Wait for photos to load
    const photoLinks = page.locator('a[href*="/photos/"]');
    await expect(photoLinks.first()).toBeVisible();

    // Click slideshow button
    const slideshowButton = page.getByLabel("Lancer le diaporama");
    await slideshowButton.click();

    // Should navigate to slideshow route
    await page.waitForURL(`**/gallery/${galleryId}/slideshow?order=date-asc`);
  });

  test("displays close button in slideshow", async ({ page }) => {
    await page.goto(`/gallery/${galleryId}/slideshow?order=date-asc`);

    // Wait for slideshow to load
    await page.waitForTimeout(1000);

    // Check for close button
    const closeButton = page.getByLabel("Fermer le diaporama");
    await expect(closeButton).toBeVisible();
  });

  test("closes slideshow when close button is clicked", async ({ page }) => {
    await page.goto(`/gallery/${galleryId}/slideshow?order=date-asc`);

    // Wait for slideshow to load
    await page.waitForTimeout(1000);

    // Click close button
    const closeButton = page.getByLabel("Fermer le diaporama");
    await closeButton.click();

    // Should navigate back to gallery
    await page.waitForURL(new RegExp(`/gallery/${galleryId}(\\?.*)?$`));
  });

  test("hides controls after 5 seconds of inactivity", async ({ page }) => {
    await page.goto(`/gallery/${galleryId}/slideshow?order=date-asc`);

    // Controls should be visible initially
    const closeButton = page.getByLabel("Fermer le diaporama");
    await expect(closeButton).toBeVisible();

    // Wait for 6 seconds (controls should hide after 5 seconds)
    await page.waitForTimeout(6000);

    // Controls should be hidden
    await expect(closeButton).toBeHidden();
  });

  test("shows controls when user interacts with slideshow", async ({
    page,
  }) => {
    await page.goto(`/gallery/${galleryId}/slideshow?order=date-asc`);

    // Wait for controls to hide
    await page.waitForTimeout(6000);

    const closeButton = page.getByLabel("Fermer le diaporama");
    await expect(closeButton).toBeHidden();

    // Click on slideshow area to show controls
    await page.mouse.click(400, 300);

    // Wait a bit for the state to update
    await page.waitForTimeout(500);

    // Controls should be visible again
    await expect(closeButton).toBeVisible();
  });

  test("displays speed control button in slideshow", async ({ page }) => {
    await page.goto(`/gallery/${galleryId}/slideshow?order=date-asc`);

    // Wait for slideshow to load
    await page.waitForTimeout(1000);

    // Check for speed button
    const speedButton = page.getByLabel(/Vitesse du diaporama/);
    await expect(speedButton).toBeVisible();
  });

  test("cycles through speed options when speed button is clicked", async ({
    page,
  }) => {
    await page.goto(`/gallery/${galleryId}/slideshow?order=date-asc`);

    // Wait for slideshow to load
    await page.waitForTimeout(1000);

    // Get speed button
    const speedButton = page.getByLabel(/Vitesse du diaporama/);
    
    // Should start with 10s
    await expect(speedButton).toHaveAccessibleName("Vitesse du diaporama: 10s");

    // Click to cycle to 30s
    await speedButton.click();
    await page.waitForTimeout(300);
    await expect(speedButton).toHaveAccessibleName("Vitesse du diaporama: 30s");

    // Click to cycle to pause
    await speedButton.click();
    await page.waitForTimeout(300);
    await expect(speedButton).toHaveAccessibleName("Vitesse du diaporama: ⏸");

    // Click to cycle to 5s
    await speedButton.click();
    await page.waitForTimeout(300);
    await expect(speedButton).toHaveAccessibleName("Vitesse du diaporama: 5s");

    // Click to cycle back to 10s
    await speedButton.click();
    await page.waitForTimeout(300);
    await expect(speedButton).toHaveAccessibleName("Vitesse du diaporama: 10s");
  });
});
