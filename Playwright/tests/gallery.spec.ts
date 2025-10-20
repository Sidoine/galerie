import { test, expect } from "@playwright/test";
import type { Locator } from "@playwright/test";
import { registerApiMocks } from "./helpers/apiMocks.ts";

const galleryId = 1;
const rootDirectoryId = 10;
const totalPhotos = 60;
const FACE_DETECTION_COMPLETED = 2;

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
    numberOfPhotos: totalPhotos,
    coverPhotoId: "cover-1",
  },
];

const mockGalleryFull = {
  minDate: "2024-01-01T00:00:00Z",
  maxDate: "2024-12-31T23:59:59Z",
  id: galleryId,
  name: "Famille 2024",
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

const mockPhotoDetailsById = Object.fromEntries(
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

async function getScrollContainerInfo(locator: Locator) {
  return locator.evaluate((node) => {
    const SCROLL_EPSILON = 1;
    let current: HTMLElement | null = node.parentElement;

    while (current) {
      const style = window.getComputedStyle(current);
      const overflowY = style.overflowY;
      const hasScrollableContent =
        current.scrollHeight - current.clientHeight > SCROLL_EPSILON;

      if (
        hasScrollableContent &&
        (overflowY === "auto" ||
          overflowY === "scroll" ||
          overflowY === "overlay")
      ) {
        return {
          scrollTop: current.scrollTop,
          tagName: current.tagName,
          id: current.id,
          className: current.className,
        };
      }
      current = current.parentElement;
    }

    return {
      scrollTop: window.scrollY,
      tagName: "WINDOW",
      id: "",
      className: "",
    };
  });
}

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
      photoDetailsById: mockPhotoDetailsById,
    });
  });

  test("renders gallery overview", async ({ page }) => {
    await page.goto(`/gallery/${galleryId}`);

    await expect(
      page.getByPlaceholder("Rechercher dans vos photos")
    ).toBeVisible();
    await expect(page.getByText("Photos", { exact: true })).toBeVisible();

    const photoLinks = page.locator('a[href*="/photos/"]');
    await expect(photoLinks.first()).toBeVisible();
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

  test("restores scroll position after closing a photo", async ({ page }) => {
    await page.goto(`/gallery/${galleryId}`);

    const targetIndex = 24;
    const targetPhoto = mockPhotos[targetIndex]!;
    const targetLocator = page.locator(`a[href*="/photos/${targetPhoto.id}"]`);

    await targetLocator.scrollIntoViewIfNeeded();
    await expect(targetLocator).toBeVisible();

    const scrollBefore = await getScrollContainerInfo(targetLocator);
    expect(scrollBefore.scrollTop).toBeGreaterThan(0);

    await targetLocator.click();

    const backButton = page.getByRole("button", {
      name: "Retour à la galerie",
    });
    await expect(backButton).toBeVisible();

    await backButton.click();
    await expect(backButton).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`/gallery/${galleryId}(\\?.*)?$`));

    await expect(targetLocator).toBeVisible();

    const scrollAfter = await getScrollContainerInfo(targetLocator);

    expect(scrollAfter.tagName).toBe(scrollBefore.tagName);
    if (scrollBefore.id || scrollAfter.id) {
      expect(scrollAfter.id).toBe(scrollBefore.id);
    }

    const scrollDelta = Math.abs(
      scrollAfter.scrollTop - scrollBefore.scrollTop
    );
    expect(scrollDelta).toBeLessThanOrEqual(5);
  });
});
