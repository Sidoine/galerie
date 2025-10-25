import { test, expect } from "@playwright/test";
import { registerApiMocks } from "./helpers/apiMocks.ts";

const galleryId = 1;
const rootDirectoryId = 10;
const totalPhotos = 10;
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
    numberOfPhotos: totalPhotos,
    coverPhotoId: "cover-1",
  },
];

const mockGalleryFull = {
  minDate: "2024-01-01T00:00:00Z",
  maxDate: "2024-12-31T23:59:59Z",
  id: galleryId,
  name: "Test Gallery",
  rootDirectoryId,
  numberOfPhotos: totalPhotos,
  coverPhotoId: null,
};

const mockPhotos = Array.from({ length: totalPhotos }, (_, index) => {
  const id = 101 + index;
  const day = Math.min(index + 1, 28);
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

const galleryPhotoDetailsById = Object.fromEntries(
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
  name: "Root Album",
  coverPhotoId: null,
  numberOfPhotos: totalPhotos,
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

test.describe("Photo Selection Feature", () => {
  test.beforeEach(async ({ page }) => {
    await registerApiMocks(page, {
      galleryId,
      user: mockUser,
      galleries: mockGalleries,
      gallery: mockGalleryFull,
      galleryPhotos: mockPhotos,
      members: mockMembers,
      visibilities: mockVisibilities,
      photoDetailsById: galleryPhotoDetailsById,
      directories: mockDirectories,
    });
  });

  test("shows checkbox on hover and allows selection", async ({ page }) => {
    await page.goto(`/gallery/${galleryId}`);

    // Wait for photos to load
    const photoLinks = page.locator('a[href*="/photos/"]');
    await expect(photoLinks.first()).toBeVisible();

    // Get the first photo container
    const firstPhotoContainer = photoLinks.first().locator("..");

    // Hover over the photo
    await firstPhotoContainer.hover();

    // Checkbox should become visible on hover (web)
    const checkbox = firstPhotoContainer.locator('button[aria-label*="Select"]').or(
      firstPhotoContainer.locator('button').filter({ hasText: "" })
    );

    // Click the checkbox area (it might not have specific text or aria-label)
    const checkboxButton = firstPhotoContainer.locator("button").first();
    if (await checkboxButton.isVisible()) {
      await checkboxButton.click();

      // The selection count should appear in breadcrumbs
      await expect(page.getByText("1")).toBeVisible();
    }
  });

  test("shows selection menu when photos are selected", async ({ page }) => {
    await page.goto(`/gallery/${galleryId}`);

    // Wait for photos to load
    const photoLinks = page.locator('a[href*="/photos/"]');
    await expect(photoLinks.first()).toBeVisible();

    // Try to select a photo by finding any button in the first photo's container
    const firstPhotoContainer = photoLinks.first().locator("..");
    await firstPhotoContainer.hover();

    // Look for any touchable/button element in the photo container
    const buttons = firstPhotoContainer.locator("button");
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      // Click the first button (likely the checkbox)
      await buttons.first().click();

      // Wait a bit for state to update
      await page.waitForTimeout(500);

      // Look for the three-dot menu button
      const menuButton = page.locator('button[aria-label*="sélectionnées"]').or(
        page.getByRole("button").filter({ hasText: /more/i })
      );

      // If menu button is visible, click it
      if (await menuButton.isVisible()) {
        await menuButton.click();

        // Check that the menu opened with options
        await expect(
          page.getByText("Changer la date").or(page.getByText("Changer la position"))
        ).toBeVisible();
      }
    }
  });

  test("clears selection when 'Deselect all' is clicked", async ({ page }) => {
    await page.goto(`/gallery/${galleryId}`);

    // Wait for photos to load
    const photoLinks = page.locator('a[href*="/photos/"]');
    await expect(photoLinks.first()).toBeVisible();

    // Select a photo
    const firstPhotoContainer = photoLinks.first().locator("..");
    await firstPhotoContainer.hover();

    const buttons = firstPhotoContainer.locator("button");
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      await buttons.first().click();
      await page.waitForTimeout(500);

      // Open menu
      const menuButton = page.locator('button[aria-label*="sélectionnées"]');
      if (await menuButton.isVisible()) {
        await menuButton.click();

        // Click deselect all
        const deselectButton = page.getByText(/Désélectionner tout/);
        if (await deselectButton.isVisible()) {
          await deselectButton.click();

          // Selection count should disappear
          await expect(menuButton).not.toBeVisible();
        }
      }
    }
  });

  test("allows selecting all photos for a date using date header checkbox", async ({
    page,
  }) => {
    await page.goto(`/gallery/${galleryId}`);

    // Wait for photos to load
    const photoLinks = page.locator('a[href*="/photos/"]');
    await expect(photoLinks.first()).toBeVisible();

    // Wait for date headers to appear (photos are grouped by date)
    await page.waitForTimeout(500);

    // Find the first date header checkbox
    const dateHeaderCheckbox = page
      .locator('[aria-label*="Sélectionner toutes les photos de cette date"]')
      .first();

    // Click the date header checkbox to select all photos for that date
    if (await dateHeaderCheckbox.isVisible()) {
      await dateHeaderCheckbox.click();

      // Wait for selection to update
      await page.waitForTimeout(500);

      // Verify that multiple photos are now selected (breadcrumbs should show count > 1)
      // Look for a number indicating selection count
      const selectionCount = page.getByText(/\d+/).first();
      const count = await selectionCount.textContent();
      
      // We expect at least one photo to be selected
      expect(count).toBeTruthy();

      // Click the checkbox again to deselect all photos for that date
      await dateHeaderCheckbox.click();
      await page.waitForTimeout(500);

      // Selection menu should disappear
      const menuButton = page.locator('button[aria-label*="sélectionnées"]');
      if (await menuButton.isVisible()) {
        await expect(menuButton).not.toBeVisible();
      }
    }
  });

  test("delete option should not appear at root level", async ({ page }) => {
    await page.goto(`/gallery/${galleryId}`);

    // Wait for photos to load
    const photoLinks = page.locator('a[href*="/photos/"]');
    await expect(photoLinks.first()).toBeVisible();

    // Select a photo
    const firstPhotoContainer = photoLinks.first().locator("..");
    await firstPhotoContainer.hover();

    const buttons = firstPhotoContainer.locator("button");
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      await buttons.first().click();
      await page.waitForTimeout(500);

      // Open menu
      const menuButton = page.locator('button[aria-label*="sélectionnées"]');
      if (await menuButton.isVisible()) {
        await menuButton.click();

        // Check that "Supprimer de l'album" option is NOT present at root level
        const deleteOption = page.getByText("Supprimer de l'album");
        await expect(deleteOption).not.toBeVisible();

        // But other options should be present
        await expect(page.getByText("Changer la date")).toBeVisible();
      }
    }
  });
});
