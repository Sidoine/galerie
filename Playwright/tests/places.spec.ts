// @ts-nocheck
import { test, expect } from "@playwright/test";
import { registerApiMocks } from "./helpers/apiMocks";

const galleryId = 1;
const rootDirectoryId = 10;
const countryId = 201;
const cityId = 301;
const LEAFLET_TEST_CSS = `
.leaflet-container { position: relative; outline: none; }
.leaflet-pane { position: absolute; left: 0; top: 0; }
.leaflet-tile-pane { position: absolute; left: 0; top: 0; }
.leaflet-marker-pane { position: absolute; left: 0; top: 0; }
.leaflet-marker-icon { position: absolute; width: 25px; height: 41px; cursor: pointer; }
`;

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

const mockCountries = [
  {
    id: countryId,
    name: "France",
    latitude: 46.2276,
    longitude: 2.2137,
    numberOfPhotos: 120,
    type: 1,
    parentId: null,
    coverPhotoId: null,
  },
  {
    id: 202,
    name: "Canada",
    latitude: 56.1304,
    longitude: -106.3468,
    numberOfPhotos: 80,
    type: 1,
    parentId: null,
    coverPhotoId: null,
  },
];

const mockCities = {
  [countryId]: [
    {
      id: cityId,
      name: "Lyon",
      latitude: 45.764,
      longitude: 4.8357,
      numberOfPhotos: 24,
      type: 2,
      parentId: countryId,
      coverPhotoId: null,
    },
    {
      id: 302,
      name: "Nice",
      latitude: 43.7102,
      longitude: 7.262,
      numberOfPhotos: 18,
      type: 2,
      parentId: countryId,
      coverPhotoId: null,
    },
  ],
};

const mockPlacesById = {
  [countryId]: {
    minDate: "2024-01-01T00:00:00Z",
    maxDate: "2024-12-31T23:59:59Z",
    id: countryId,
    name: "France",
    latitude: 46.2276,
    longitude: 2.2137,
    numberOfPhotos: 120,
    type: 1,
    parentId: null,
    coverPhotoId: null,
  },
  [cityId]: {
    minDate: "2024-04-01T08:00:00Z",
    maxDate: "2024-09-20T18:45:00Z",
    id: cityId,
    name: "Lyon",
    latitude: 45.764,
    longitude: 4.8357,
    numberOfPhotos: 24,
    type: 2,
    parentId: countryId,
    coverPhotoId: null,
  },
};

const mockPlacePhotos = {
  [cityId]: [
    {
      id: 501,
      publicId: "lyon-501",
      name: "Quais de Saône",
      video: false,
      directoryId: rootDirectoryId,
      dateTime: "2024-05-14T10:00:00Z",
      place: {
        id: cityId,
        name: "Lyon",
      },
    },
    {
      id: 502,
      publicId: "lyon-502",
      name: "Parc de la Tête d'Or",
      video: false,
      directoryId: rootDirectoryId,
      dateTime: "2024-06-02T14:30:00Z",
      place: {
        id: cityId,
        name: "Lyon",
      },
    },
  ],
};

const mockPhotoCounts = {
  [countryId]: 120,
  [cityId]: mockPlacePhotos[cityId].length,
};

test.describe("Places map", () => {
  test.beforeEach(async ({ page }) => {
    await registerApiMocks(page, {
      galleryId,
      user: mockUser,
      galleries: mockGalleries,
      gallery: mockGalleryFull,
      galleryPhotos: mockPhotos,
      members: mockMembers,
      visibilities: mockVisibilities,
      places: {
        countries: mockCountries,
        citiesByCountry: mockCities,
        placesById: mockPlacesById,
        placePhotos: mockPlacePhotos,
        photoCount: mockPhotoCounts,
      },
    });

    await page.route("**/tile.openstreetmap.org/**", (route) =>
      route.fulfill({ status: 200, body: "" })
    );
    await page.route("**/unpkg.com/**", (route) =>
      route.fulfill({
        status: 200,
        headers: { "content-type": "text/css" },
        body: LEAFLET_TEST_CSS,
      })
    );
  });

  test("renders map with country markers", async ({ page }) => {
    await page.goto(`/gallery/${galleryId}/places`);

    const map = page.locator(".leaflet-container");
    await expect(map).toBeVisible();

    const mapBox = await map.boundingBox();
    expect(mapBox?.height ?? 0).toBeGreaterThan(200);
    expect(mapBox?.width ?? 0).toBeGreaterThan(200);

    const markers = page.getByRole("button", { name: "Marker" });
    await expect(markers).toHaveCount(mockCountries.length);
  });

  test("navigates to a country and shows its markers", async ({ page }) => {
    await page.goto(`/gallery/${galleryId}/places`);

    await page.getByRole("link", { name: /France/ }).click();
    await page.waitForURL(`**/gallery/${galleryId}/places/${countryId}`);

    const cityMarkers = page.getByRole("button", { name: "Marker" });
    await expect(cityMarkers).toHaveCount(mockCities[countryId].length);
  });

  test("navigates from country to city and lists photos", async ({ page }) => {
    await page.goto(`/gallery/${galleryId}/places/${countryId}`);

    await page.getByRole("link", { name: /Lyon/ }).click();
    await page.waitForURL(`**/gallery/${galleryId}/places/${cityId}`);

    const cityPhotoLinks = page.locator(`a[href*="/places/${cityId}/photos/"]`);
    await expect(cityPhotoLinks).toHaveCount(mockPlacePhotos[cityId].length);
  });
});
