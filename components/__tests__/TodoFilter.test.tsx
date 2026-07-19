import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoFilter } from "@/components/TodoFilter";

vi.mock("@/app/actions", () => ({
  toggleTodo: vi.fn(),
  deleteTodo: vi.fn(),
  updateTodo: vi.fn(),
  reorderTodo: vi.fn(),
}));

function makeTodo(overrides: Partial<{
  id: number;
  title: string;
  completed: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: Date | null;
  sortOrder: number;
  categoryId: number | null;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  return {
    id: 1,
    title: "Test todo",
    completed: false,
    priority: "MEDIUM" as const,
    dueDate: null as Date | null,
    sortOrder: 0,
    categoryId: null as number | null,
    userId: 1,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

describe("TodoFilter", () => {
  // AC-3: Filter bar renders
  it("renders status filter buttons (covers: AC-3)", () => {
    render(<TodoFilter categories={[]} todos={[]} />);

    expect(screen.getByRole("button", { name: "Show all todos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show active todos" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show completed todos" })).toBeInTheDocument();
  });

  it("renders sort dropdown (covers: AC-3)", () => {
    render(<TodoFilter categories={[]} todos={[]} />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Sort:")).toBeInTheDocument();
  });

  it("All button is selected by default", () => {
    render(<TodoFilter categories={[]} todos={[]} />);

    const allBtn = screen.getByRole("button", { name: "Show all todos" });
    // The active pill has different styling; check it has the active class
    expect(allBtn.className).toContain("bg-background");
  });

  // AC-3: Filtering
  it("shows only active todos when Active is selected (covers: AC-3)", async () => {
    const user = userEvent.setup();
    const todos = [
      makeTodo({ id: 1, title: "Active todo", completed: false }),
      makeTodo({ id: 2, title: "Done todo", completed: true }),
    ];

    render(<TodoFilter categories={[]} todos={todos} />);

    // Click Active filter
    await user.click(screen.getByRole("button", { name: "Show active todos" }));

    expect(screen.getByText("Active todo")).toBeInTheDocument();
    expect(screen.queryByText("Done todo")).not.toBeInTheDocument();
  });

  it("shows only completed todos when Completed is selected (covers: AC-3)", async () => {
    const user = userEvent.setup();
    const todos = [
      makeTodo({ id: 1, title: "Active todo", completed: false }),
      makeTodo({ id: 2, title: "Done todo", completed: true }),
    ];

    render(<TodoFilter categories={[]} todos={todos} />);

    await user.click(screen.getByRole("button", { name: "Show completed todos" }));

    expect(screen.queryByText("Active todo")).not.toBeInTheDocument();
    expect(screen.getByText("Done todo")).toBeInTheDocument();
  });

  it("shows all todos when All is selected (covers: AC-3)", async () => {
    const user = userEvent.setup();
    const todos = [
      makeTodo({ id: 1, title: "Active todo", completed: false }),
      makeTodo({ id: 2, title: "Done todo", completed: true }),
    ];

    render(<TodoFilter categories={[]} todos={todos} />);

    // First click Active to filter, then back to All
    await user.click(screen.getByRole("button", { name: "Show active todos" }));
    await user.click(screen.getByRole("button", { name: "Show all todos" }));

    expect(screen.getByText("Active todo")).toBeInTheDocument();
    expect(screen.getByText("Done todo")).toBeInTheDocument();
  });

  // AC-3: Empty state when list is empty
  it("shows empty state when there are no todos (covers: AC-3, AC-5)", () => {
    render(<TodoFilter categories={[]} todos={[]} />);

    expect(screen.getByText("No todos yet. Add one above.")).toBeInTheDocument();
  });

  // AC-2: Custom sort is the default and available in the dropdown
  it("defaults to Custom sort (covers: AC-2)", () => {
    render(<TodoFilter categories={[]} todos={[]} />);

    const select = screen.getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("custom");
  });

  it("includes all five sort options: Priority, Due date, Newest, Custom, Category (covers: AC-2)", () => {
    render(<TodoFilter categories={[]} todos={[]} />);

    const options = screen.getAllByRole("option");
    const optionTexts = options.map((o) => (o as HTMLOptionElement).textContent);
    expect(optionTexts).toEqual(["Priority", "Due date", "Newest", "Custom", "Category"]);
  });

  // Accessibility: status filter buttons have aria-pressed and accessible names
  it("status filter buttons have aria-pressed and accessible names", () => {
    render(<TodoFilter categories={[]} todos={[]} />);

    const allBtn = screen.getByRole("button", { name: "Show all todos" });
    expect(allBtn).toHaveAttribute("aria-pressed", "true");

    const activeBtn = screen.getByRole("button", { name: "Show active todos" });
    expect(activeBtn).toHaveAttribute("aria-pressed", "false");

    const completedBtn = screen.getByRole("button", { name: "Show completed todos" });
    expect(completedBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("aria-pressed updates when a different filter is selected", async () => {
    const user = userEvent.setup();
    render(<TodoFilter categories={[]} todos={[]} />);

    await user.click(screen.getByRole("button", { name: "Show active todos" }));

    expect(screen.getByRole("button", { name: "Show all todos" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Show active todos" })).toHaveAttribute("aria-pressed", "true");
  });

  // Accessibility: aria-live region announces todo count
  it("aria-live region announces todo count", () => {
    render(<TodoFilter categories={[]} todos={[]} />);
    expect(screen.getByText("0 todos total")).toBeInTheDocument();
  });

  it("aria-live region updates count when todos exist", () => {
    const todos = [
      makeTodo({ id: 1, title: "First", completed: false }),
      makeTodo({ id: 2, title: "Second", completed: true }),
    ];
    render(<TodoFilter categories={[]} todos={todos} />);
    expect(screen.getByText("2 todos total")).toBeInTheDocument();
  });
});
