import { test, expect } from "@playwright/test";

test.describe("Todo CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    // Clean up any existing todos from previous runs
    const deleteButtons = page.getByRole("button", { name: "Delete todo" });
    while ((await deleteButtons.count()) > 0) {
      const btn = deleteButtons.first();
      await btn.click();
      // Wait for this specific button to disappear (RSC re-render complete)
      // toBeHidden retries until the element is detached from the DOM
      await expect(btn).toBeHidden({ timeout: 5000 });
    }
  });

  // AC-5: Empty state renders when list is empty
  test("shows empty state when no todos exist (covers: AC-5)", async ({ page }) => {
    await expect(
      page.getByText("No todos yet. Add one above.")
    ).toBeVisible();
  });

  // AC-1: User can add a todo with a title
  // AC-2: See it appear in the list
  test("can create a todo and see it in the list (covers: AC-1, AC-2)", async ({ page }) => {
    await page.getByPlaceholder("What needs to be done?").fill("Buy milk");
    await page.getByRole("button", { name: "Add" }).click();

    await expect(page.getByText("Buy milk")).toBeVisible();
    await expect(
      page.getByText("No todos yet. Add one above.")
    ).not.toBeVisible();
  });

  // AC-3: Check it off (and uncheck)
  test("can toggle a todo complete and incomplete (covers: AC-3)", async ({ page }) => {
    // Create a todo first
    await page.getByPlaceholder("What needs to be done?").fill("Toggle me");
    await page.getByRole("button", { name: "Add" }).click();

    const todoText = page.getByText("Toggle me");

    // Target the toggle button within this specific todo's list item
    const listItem = page.getByRole("listitem").filter({ hasText: "Toggle me" });
    const toggleButton = listItem.getByRole("button", { name: "Mark complete" });

    // Mark complete
    await toggleButton.click();
    await expect(todoText).toHaveClass(/line-through/);

    // Mark incomplete
    await listItem.getByRole("button", { name: "Mark incomplete" }).click();
    await expect(todoText).not.toHaveClass(/line-through/);
  });

  // AC-4: Delete it
  test("can delete a todo (covers: AC-4)", async ({ page }) => {
    // Create a todo first
    await page.getByPlaceholder("What needs to be done?").fill("Delete me");
    await page.getByRole("button", { name: "Add" }).click();

    await expect(page.getByText("Delete me")).toBeVisible();

    // Target the delete button within this specific todo's list item
    const listItem = page.getByRole("listitem").filter({ hasText: "Delete me" });
    await listItem.getByRole("button", { name: "Delete todo" }).click();

    await expect(page.getByText("Delete me")).not.toBeVisible();
    await expect(
      page.getByText("No todos yet. Add one above.")
    ).toBeVisible();
  });

  test("full CRUD flow: create, toggle, delete (covers: AC-1, AC-2, AC-3, AC-4, AC-5)", async ({ page }) => {
    // Start empty (cleanup ran in beforeEach)
    await expect(
      page.getByText("No todos yet. Add one above.")
    ).toBeVisible();

    // Create two todos
    await page.getByPlaceholder("What needs to be done?").fill("First");
    await page.getByRole("button", { name: "Add" }).click();
    await page.getByPlaceholder("What needs to be done?").fill("Second");
    await page.getByRole("button", { name: "Add" }).click();

    await expect(page.getByText("First")).toBeVisible();
    await expect(page.getByText("Second")).toBeVisible();

    // Toggle the first one
    const firstItem = page.getByRole("listitem").filter({ hasText: "First" });
    await firstItem.getByRole("button", { name: "Mark complete" }).click();
    await expect(page.getByText("First")).toHaveClass(/line-through/);

    // Delete the second one
    const secondItem = page.getByRole("listitem").filter({ hasText: "Second" });
    await secondItem.getByRole("button", { name: "Delete todo" }).click();
    await expect(page.getByText("Second")).not.toBeVisible();

    // Delete the first one too
    const firstItemAfter = page.getByRole("listitem").filter({ hasText: "First" });
    await firstItemAfter.getByRole("button", { name: "Delete todo" }).click();

    // Back to empty
    await expect(
      page.getByText("No todos yet. Add one above.")
    ).toBeVisible();
  });
});
