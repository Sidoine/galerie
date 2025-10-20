import { test, expect } from "@playwright/test";

const loginPath = "/sign-in";

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(loginPath);
  });

  test("renders the sign in form", async ({ page }) => {
    await expect(page.getByText("Sign In", { exact: true })).toBeVisible();
    await expect(page.getByPlaceholder("Email")).toBeVisible();
    await expect(page.getByPlaceholder("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("allows entering credentials", async ({ page }) => {
    const emailInput = page.getByPlaceholder("Email");
    const passwordInput = page.getByPlaceholder("Password");

    await emailInput.fill("user@example.com");
    await passwordInput.fill("hunter2");

    await expect(emailInput).toHaveValue("user@example.com");
    await expect(passwordInput).toHaveValue("hunter2");
  });

  test("submits credentials to the backend", async ({ page }) => {
    await page.route("**/login", async (route) => {
      const requestBody = JSON.parse(route.request().postData() ?? "{}");
      expect(requestBody).toEqual({
        email: "admin@example.com",
        password: "passw0rd",
      });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          tokenType: "Bearer",
          accessToken: "token",
          refreshToken: "refresh",
          expiresIn: 3600,
        }),
      });
    });

    await page.getByPlaceholder("Email").fill("admin@example.com");
    await page.getByPlaceholder("Password").fill("passw0rd");
    await page.getByRole("button", { name: "Sign in" }).click();
  });
});
