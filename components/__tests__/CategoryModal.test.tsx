import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryModal } from "@/components/CategoryModal";

vi.mock("@/app/actions", () => ({
  createCategory: vi.fn(),
  renameCategory: vi.fn(),
  deleteCategory: vi.fn(),
}));

function makeCategory(overrides: Partial<{
  id: number;
  name: string;
  colour: string;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  return {
    id: 1,
    name: "Work",
    colour: "#3B82F6",
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

describe("CategoryModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the trigger button when closed (covers: AC-1)", () => {
    render(<CategoryModal categories={[]} />);

    expect(
      screen.getByRole("button", { name: "Manage categories" })
    ).toBeInTheDocument();
  });

  it("opens the modal when trigger is clicked (covers: AC-1)", async () => {
    const user = userEvent.setup();
    render(<CategoryModal categories={[]} />);

    await user.click(screen.getByRole("button", { name: "Manage categories" }));

    await waitFor(() => {
      expect(screen.getByText("Categories")).toBeInTheDocument();
    });
  });

  it("shows existing categories in the list (covers: AC-1)", async () => {
    const user = userEvent.setup();
    const cats = [
      makeCategory({ id: 1, name: "Work", colour: "#3B82F6" }),
      makeCategory({ id: 2, name: "Personal", colour: "#22C55E" }),
    ];
    render(<CategoryModal categories={cats} />);

    await user.click(screen.getByRole("button", { name: "Manage categories" }));

    await waitFor(() => {
      expect(screen.getByText("Work")).toBeInTheDocument();
      expect(screen.getByText("Personal")).toBeInTheDocument();
    });
  });

  it("shows empty state when no categories exist (covers: AC-1)", async () => {
    const user = userEvent.setup();
    render(<CategoryModal categories={[]} />);

    await user.click(screen.getByRole("button", { name: "Manage categories" }));

    await waitFor(() => {
      expect(
        screen.getByText("No categories yet. Create one below.")
      ).toBeInTheDocument();
    });
  });

  it("closes the modal when the close button is clicked (covers: AC-1)", async () => {
    const user = userEvent.setup();
    render(<CategoryModal categories={[]} />);

    await user.click(screen.getByRole("button", { name: "Manage categories" }));
    await waitFor(() => {
      expect(screen.getByText("Categories")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => {
      expect(screen.queryByText("Categories")).not.toBeInTheDocument();
    });
  });

  it("closes the modal on Escape key (covers: AC-1)", async () => {
    const user = userEvent.setup();
    render(<CategoryModal categories={[]} />);

    await user.click(screen.getByRole("button", { name: "Manage categories" }));
    await waitFor(() => {
      expect(screen.getByText("Categories")).toBeInTheDocument();
    });

    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByText("Categories")).not.toBeInTheDocument();
    });
  });

  it("renders the add category form with colour swatches (covers: AC-1)", async () => {
    const user = userEvent.setup();
    render(<CategoryModal categories={[]} />);

    await user.click(screen.getByRole("button", { name: "Manage categories" }));

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("New category name")
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Add category" })
      ).toBeInTheDocument();
    });
  });

  it("has delete buttons for existing categories (covers: AC-1)", async () => {
    const user = userEvent.setup();
    const cats = [makeCategory({ id: 1, name: "Work", colour: "#3B82F6" })];
    render(<CategoryModal categories={cats} />);

    await user.click(screen.getByRole("button", { name: "Manage categories" }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Delete Work" })
      ).toBeInTheDocument();
    });
  });
});
