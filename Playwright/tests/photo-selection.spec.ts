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
    name: "Test Gallery",
    rootDirectoryId,
    numberOfPhotos: 10,
    coverPhotoId: "cover-1",
  },
];

const mockGalleryFull = {
  minDate: "2024-01-01T00:00:00Z",
  maxDate: "2024-12-31T23:59:59Z",
  id: galleryId,
  name: "Test Gallery",
  rootDirectoryId,
  numberOfPhotos: 10,
  coverPhotoId: null,
};

const mockPhotos = Array.from({ length: 10 }, (_, index) => {
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

test.describe("Photo Selection", () => {
  test.beforeEach(async ({ page }) => {
    await registerApiMocks(page, {
      galleryId,
      user: mockUser,
      galleries: mockGalleries,
      gallery: mockGalleryFull,
      galleryPhotos: mockPhotos,
      members: [
        {
          userId: mockUser.id,
          galleryId,
          administrator: true,
        },
      ],
      visibilities: [],
    });

    await page.goto(`/gallery/${galleryId}`);
    await page.waitForLoadState("networkidle");
  });

  test("should show checkbox on hover (web)", async ({ page }) => {
    // Wait for photos to load
    await page.waitForSelector('img[src*="thumbnail"]', { timeout: 10000 });

    // Get the first photo
    const firstPhoto = page.locator('img[src*="thumbnail"]').first();
    const photoContainer = firstPhoto.locator("..");

    // Hover over the photo
    await photoContainer.hover();

    // Check if checkbox appears
    await expect(photoContainer.locator('svg[data-icon="check"]').locator("..")
      .locator("..")
    ).toBeVisible();
  });

  test("should select photo on checkbox click", async ({ page }) => {
    // Wait for photos to load
    await page.waitForSelector('img[src*="thumbnail"]', { timeout: 10000 });

    // Get the first photo container
    const photoContainers = page.locator('img[src*="thumbnail"]').locator("..");

    // Hover over first photo to show checkbox
    await photoContainers.first().hover();

    // Click the checkbox
    const checkbox = photoContainers.first().locator('svg[data-icon="check"]')
      .locator("..")
      .locator("..");
    await checkbox.click();

    // Verify selection count appears in breadcrumbs
    await expect(page.locator("text=1 sélectionnée")).toBeVisible();
  });

  test("should show action menu when photos are selected", async ({ page }) => {
    // Wait for photos to load
    await page.waitForSelector('img[src*="thumbnail"]', { timeout: 10000 });

    // Get the first photo container
    const photoContainers = page.locator('img[src*="thumbnail"]').locator("..");

    // Hover and click checkbox
    await photoContainers.first().hover();
    const checkbox = photoContainers.first().locator('svg[data-icon="check"]')
      .locator("..")
      .locator("..");
    await checkbox.click();

    // Click the three-dot menu
    const moreButton = page.locator('[aria-label*="more"]').or(
      page.locator('svg[data-icon="more-vert"]')
    );
    await moreButton.click();

    // Verify action menu options appear
    await expect(page.locator("text=Modifier la date")).toBeVisible();
    await expect(page.locator("text=Modifier la position")).toBeVisible();
  });

  test("should select multiple photos", async ({ page }) => {
    // Wait for photos to load
    await page.waitForSelector('img[src*="thumbnail"]', { timeout: 10000 });

    // Get photo containers
    const photoContainers = page.locator('img[src*="thumbnail"]').locator("..");

    // Select first photo
    await photoContainers.first().hover();
    let checkbox = photoContainers.first().locator('svg[data-icon="check"]')
      .locator("..")
      .locator("..");
    await checkbox.click();

    // Select second photo
    await photoContainers.nth(1).hover();
    checkbox = photoContainers.nth(1).locator('svg[data-icon="check"]')
      .locator("..")
      .locator("..");
    await checkbox.click();

    // Verify selection count
    await expect(page.locator("text=2 sélectionnées")).toBeVisible();
  });

  test("should deselect photo on second click", async ({ page }) => {
    // Wait for photos to load
    await page.waitForSelector('img[src*="thumbnail"]', { timeout: 10000 });

    // Get the first photo container
    const photoContainers = page.locator('img[src*="thumbnail"]').locator("..");

    // Select photo
    await photoContainers.first().hover();
    const checkbox = photoContainers.first().locator('svg[data-icon="check"]')
      .locator("..")
      .locator("..");
    await checkbox.click();

    // Verify selected
    await expect(page.locator("text=1 sélectionnée")).toBeVisible();

    // Deselect photo
    await checkbox.click();

    // Verify deselected (selection count should disappear)
    await expect(page.locator("text=1 sélectionnée")).not.toBeVisible();
  });
});
