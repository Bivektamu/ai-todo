import { test, expect } from "@playwright/test";

const TEST_EMAIL = "e2e@test.com";
const TEST_PASSWORD = "e2e-test-password";

async function authenticate(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByPlaceholder("Email").fill(TEST_EMAIL);
  await page.getByPlaceholder("Password").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "Sign in with email" }).click();
  // Wait for redirect to /
  await page.waitForURL("/", { timeout: 10000 });
}

test.describe("Todo CRUD", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);

    // Open category modal and delete all existing categories
    const manageBtn = page.getByRole("button", { name: "Manage categories" });
    if (await manageBtn.isVisible()) {
      await manageBtn.click();
      // Delete all categories
      const deleteCatButtons = page.getByRole("button", { name: /^Delete / });
      while ((await deleteCatButtons.count()) > 0) {
        const btn = deleteCatButtons.first();
        await btn.click();
        await page.waitForTimeout(300);
      }
      // Close modal
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }

    // Clean up any existing todos from previous runs
    const deleteButtons = page.getByRole("button", { name: "Delete todo" });
    while ((await deleteButtons.count()) > 0) {
      const btn = deleteButtons.first();
      await btn.click();
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

test.describe("Todo Categories", () => {
  test.beforeEach(async ({ page }) => {
    await authenticate(page);

    // Clean up todos
    const deleteButtons = page.getByRole("button", { name: "Delete todo" });
    while ((await deleteButtons.count()) > 0) {
      const btn = deleteButtons.first();
      await btn.click();
      await expect(btn).toBeHidden({ timeout: 5000 });
    }

    // Clean up categories
    const manageBtn = page.getByRole("button", { name: "Manage categories" });
    if (await manageBtn.isVisible()) {
      await manageBtn.click();
      const deleteCatButtons = page.getByRole("button", { name: /^Delete / });
      while ((await deleteCatButtons.count()) > 0) {
        const btn = deleteCatButtons.first();
        await btn.click();
        await page.waitForTimeout(300);
      }
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }
  });

  test("can create, rename, and delete a category (covers: AC-1, AC-5)", async ({ page }) => {
    // Open modal
    await page.getByRole("button", { name: "Manage categories" }).click();
    await expect(page.getByText("Categories")).toBeVisible();

    // Create category
    await page.getByPlaceholder("New category name").fill("Work");
    await page.getByRole("button", { name: "Add category" }).click();
    await expect(page.getByText("Work")).toBeVisible();

    // Rename category
    await page.getByRole("button", { name: "Rename Work" }).click();
    const editInput = page.locator('input[name="name"][value="Work"]');
    await editInput.fill("Office");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Office")).toBeVisible();
    await expect(page.getByText("Work")).not.toBeVisible();

    // Delete category
    await page.getByRole("button", { name: "Delete Office" }).click();
    await expect(page.getByText("Office")).not.toBeVisible();
    await expect(
      page.getByText("No categories yet. Create one below.")
    ).toBeVisible();

    // Close modal
    await page.keyboard.press("Escape");
  });

  test("can assign a category to a todo at creation (covers: AC-2, AC-3)", async ({ page }) => {
    // Create a category first
    await page.getByRole("button", { name: "Manage categories" }).click();
    await page.getByPlaceholder("New category name").fill("Work");
    await page.getByRole("button", { name: "Add category" }).click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Create a todo with the category
    await page.getByPlaceholder("What needs to be done?").fill("Review PR");
    // Select the category from the dropdown
    const categorySelect = page.locator('select[name="categoryId"]');
    await categorySelect.selectOption({ label: "Work" });
    await page.getByRole("button", { name: "Add" }).click();

    // Verify the todo appears with the category badge
    await expect(page.getByText("Review PR")).toBeVisible();
    const listItem = page.getByRole("listitem").filter({ hasText: "Review PR" });
    await expect(listItem.getByText("Work")).toBeVisible();
  });

  test("can filter by category chip (covers: AC-4)", async ({ page }) => {
    // Create two categories
    await page.getByRole("button", { name: "Manage categories" }).click();
    await page.getByPlaceholder("New category name").fill("Work");
    await page.getByRole("button", { name: "Add category" }).click();
    await page.getByPlaceholder("New category name").fill("Personal");
    await page.getByRole("button", { name: "Add category" }).click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Create a Work todo
    await page.getByPlaceholder("What needs to be done?").fill("Work task");
    const catSelect1 = page.locator('select[name="categoryId"]');
    await catSelect1.selectOption({ label: "Work" });
    await page.getByRole("button", { name: "Add" }).click();

    // Create a Personal todo
    await page.getByPlaceholder("What needs to be done?").fill("Personal task");
    await catSelect1.selectOption({ label: "Personal" });
    await page.getByRole("button", { name: "Add" }).click();

    // Both todos visible
    await expect(page.getByText("Work task")).toBeVisible();
    await expect(page.getByText("Personal task")).toBeVisible();

    // Click the Work chip
    await page.getByRole("button", { name: "Work" }).first().click();

    // Only Work task visible
    await expect(page.getByText("Work task")).toBeVisible();
    await expect(page.getByText("Personal task")).not.toBeVisible();

    // Click Work chip again to deselect
    await page.getByRole("button", { name: "Work" }).first().click();

    // Both visible again
    await expect(page.getByText("Work task")).toBeVisible();
    await expect(page.getByText("Personal task")).toBeVisible();
  });

  test("can inline edit a todo's category (covers: AC-2, AC-3)", async ({ page }) => {
    // Create a category
    await page.getByRole("button", { name: "Manage categories" }).click();
    await page.getByPlaceholder("New category name").fill("Work");
    await page.getByRole("button", { name: "Add category" }).click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Create a todo without a category
    await page.getByPlaceholder("What needs to be done?").fill("No cat");
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByText("No cat")).toBeVisible();

    // Inline edit: change category to Work
    const listItem = page.getByRole("listitem").filter({ hasText: "No cat" });
    const inlineSelect = listItem.locator('select[name="categoryId"]');
    await inlineSelect.selectOption({ label: "Work" });

    // Verify the badge appears
    await expect(listItem.getByText("Work")).toBeVisible();
  });

  test("Category appears in sort dropdown (covers: AC-4)", async ({ page }) => {
    // Create two categories
    await page.getByRole("button", { name: "Manage categories" }).click();
    await page.getByPlaceholder("New category name").fill("Zebra");
    await page.getByRole("button", { name: "Add category" }).click();
    await page.getByPlaceholder("New category name").fill("Alpha");
    await page.getByRole("button", { name: "Add category" }).click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Create uncategorized todo
    await page.getByPlaceholder("What needs to be done?").fill("No category");
    await page.getByRole("button", { name: "Add" }).click();

    // Create Alpha todo
    await page.getByPlaceholder("What needs to be done?").fill("Alpha task");
    const catSelect = page.locator('select[name="categoryId"]');
    await catSelect.selectOption({ label: "Alpha" });
    await page.getByRole("button", { name: "Add" }).click();

    // Create Zebra todo
    await page.getByPlaceholder("What needs to be done?").fill("Zebra task");
    await catSelect.selectOption({ label: "Zebra" });
    await page.getByRole("button", { name: "Add" }).click();

    // Select Category sort
    await page.locator("#todo-sort").selectOption("category");

    // Verify order: Alpha task first, then Zebra task, then No category last
    const items = page.getByRole("listitem");
    await expect(items.nth(0)).toContainText("Alpha task");
    await expect(items.nth(1)).toContainText("Zebra task");
    await expect(items.nth(2)).toContainText("No category");
  });
});
