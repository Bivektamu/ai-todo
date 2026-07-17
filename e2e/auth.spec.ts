import { test, expect } from "@playwright/test";

const TEST_EMAIL_PREFIX = "e2e-auth-";
const TEST_PASSWORD = "e2e-test-password";

function uniqueEmail(): string {
  return `${TEST_EMAIL_PREFIX}${Date.now()}@test.com`;
}

test.describe("Authentication", () => {
  test.describe("Middleware redirect (AC-5)", () => {
    test("redirects unauthenticated visitor from / to /login", async ({ page }) => {
      await page.goto("/");
      await expect(page).toHaveURL(/\/login/);
      await expect(page.getByText("Sign in")).toBeVisible();
      await expect(page.getByRole("button", { name: "Sign in with email" })).toBeVisible();
    });
  });

  test.describe("Credentials sign in and sign up (AC-3, AC-7)", () => {
    test("signs up a new user and redirects to /", async ({ page }) => {
      const email = uniqueEmail();
      await page.goto("/login");
      await page.getByPlaceholder("Email").fill(email);
      await page.getByPlaceholder("Password").fill(TEST_PASSWORD);
      await page.getByRole("button", { name: "Sign in with email" }).click();

      await page.waitForURL("/", { timeout: 10000 });
      await expect(page.getByText("Todo")).toBeVisible();
      await expect(page.getByText("Sign out")).toBeVisible();
    });

    test("signs in an existing user with correct password", async ({ page }) => {
      const email = uniqueEmail();
      // First sign in creates the user
      await page.goto("/login");
      await page.getByPlaceholder("Email").fill(email);
      await page.getByPlaceholder("Password").fill(TEST_PASSWORD);
      await page.getByRole("button", { name: "Sign in with email" }).click();
      await page.waitForURL("/", { timeout: 10000 });

      // Sign out
      await page.getByRole("button", { name: "Sign out" }).click();
      await page.waitForURL(/\/login/, { timeout: 10000 });

      // Sign in again with same credentials
      await page.getByPlaceholder("Email").fill(email);
      await page.getByPlaceholder("Password").fill(TEST_PASSWORD);
      await page.getByRole("button", { name: "Sign in with email" }).click();
      await page.waitForURL("/", { timeout: 10000 });
      await expect(page.getByText("Todo")).toBeVisible();
    });

    test("rejects sign in with wrong password", async ({ page }) => {
      const email = uniqueEmail();
      // Create the user first
      await page.goto("/login");
      await page.getByPlaceholder("Email").fill(email);
      await page.getByPlaceholder("Password").fill(TEST_PASSWORD);
      await page.getByRole("button", { name: "Sign in with email" }).click();
      await page.waitForURL("/", { timeout: 10000 });

      // Sign out
      await page.getByRole("button", { name: "Sign out" }).click();
      await page.waitForURL(/\/login/, { timeout: 10000 });

      // Try wrong password
      await page.getByPlaceholder("Email").fill(email);
      await page.getByPlaceholder("Password").fill("wrong-password");
      await page.getByRole("button", { name: "Sign in with email" }).click();

      // Should stay on /login (Auth.js redirects to error page by default, but we mapped error to /login)
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe("Sign out (AC-6)", () => {
    test("sign out clears session and redirects to /login", async ({ page }) => {
      const email = uniqueEmail();
      await page.goto("/login");
      await page.getByPlaceholder("Email").fill(email);
      await page.getByPlaceholder("Password").fill(TEST_PASSWORD);
      await page.getByRole("button", { name: "Sign in with email" }).click();
      await page.waitForURL("/", { timeout: 10000 });

      // Sign out
      await page.getByRole("button", { name: "Sign out" }).click();
      await page.waitForURL(/\/login/, { timeout: 10000 });
      await expect(page.getByText("Sign in")).toBeVisible();

      // After sign out, / should redirect back to /login
      await page.goto("/");
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe("User isolation (AC-4)", () => {
    test("user A cannot see user B's todos", async ({ page: pageA }) => {
      const emailA = uniqueEmail();
      const emailB = uniqueEmail();

      // User A signs in and creates a todo
      await pageA.goto("/login");
      await pageA.getByPlaceholder("Email").fill(emailA);
      await pageA.getByPlaceholder("Password").fill(TEST_PASSWORD);
      await pageA.getByRole("button", { name: "Sign in with email" }).click();
      await pageA.waitForURL("/", { timeout: 10000 });

      await pageA.getByPlaceholder("What needs to be done?").fill("User A secret todo");
      await pageA.getByRole("button", { name: "Add" }).click();
      await expect(pageA.getByText("User A secret todo")).toBeVisible();

      // Sign out user A
      await pageA.getByRole("button", { name: "Sign out" }).click();
      await pageA.waitForURL(/\/login/, { timeout: 10000 });

      // User B signs in (separate context already via pageA fixture? No, need separate browser context)
      // Using a new page in the same context would share cookies. Use a second browser context.
      const browser = pageA.context().browser()!;
      const contextB = await browser.newContext();
      const pageB = await contextB.newPage();

      await pageB.goto("/login");
      await pageB.getByPlaceholder("Email").fill(emailB);
      await pageB.getByPlaceholder("Password").fill(TEST_PASSWORD);
      await pageB.getByRole("button", { name: "Sign in with email" }).click();
      await pageB.waitForURL("/", { timeout: 10000 });

      // User B should not see User A's todo
      await expect(pageB.getByText("User A secret todo")).not.toBeVisible();
      await expect(pageB.getByText("No todos yet. Add one above.")).toBeVisible();

      await contextB.close();
    });
  });
});
