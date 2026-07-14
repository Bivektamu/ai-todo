import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoFilter } from "@/components/TodoFilter";

vi.mock("@/app/actions", () => ({
  toggleTodo: vi.fn(),
  deleteTodo: vi.fn(),
  updateTodo: vi.fn(),
}));

function makeTodo(overrides: Partial<{
  id: number;
  title: string;
  completed: boolean;
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  return {
    id: 1,
    title: "Test todo",
    completed: false,
    priority: "MEDIUM" as const,
    dueDate: null as Date | null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

describe("TodoFilter", () => {
  // AC-3: Filter bar renders
  it("renders status filter buttons (covers: AC-3)", () => {
    render(<TodoFilter todos={[]} />);

    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Active" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Completed" })).toBeInTheDocument();
  });

  it("renders sort dropdown (covers: AC-3)", () => {
    render(<TodoFilter todos={[]} />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("Sort:")).toBeInTheDocument();
  });

  it("All button is selected by default", () => {
    render(<TodoFilter todos={[]} />);

    const allBtn = screen.getByRole("button", { name: "All" });
    // The active pill has different styling; check it has the active class
    expect(allBtn.className).toContain("bg-white");
  });

  // AC-3: Filtering
  it("shows only active todos when Active is selected (covers: AC-3)", async () => {
    const user = userEvent.setup();
    const todos = [
      makeTodo({ id: 1, title: "Active todo", completed: false }),
      makeTodo({ id: 2, title: "Done todo", completed: true }),
    ];

    render(<TodoFilter todos={todos} />);

    // Click Active filter
    await user.click(screen.getByRole("button", { name: "Active" }));

    expect(screen.getByText("Active todo")).toBeInTheDocument();
    expect(screen.queryByText("Done todo")).not.toBeInTheDocument();
  });

  it("shows only completed todos when Completed is selected (covers: AC-3)", async () => {
    const user = userEvent.setup();
    const todos = [
      makeTodo({ id: 1, title: "Active todo", completed: false }),
      makeTodo({ id: 2, title: "Done todo", completed: true }),
    ];

    render(<TodoFilter todos={todos} />);

    await user.click(screen.getByRole("button", { name: "Completed" }));

    expect(screen.queryByText("Active todo")).not.toBeInTheDocument();
    expect(screen.getByText("Done todo")).toBeInTheDocument();
  });

  it("shows all todos when All is selected (covers: AC-3)", async () => {
    const user = userEvent.setup();
    const todos = [
      makeTodo({ id: 1, title: "Active todo", completed: false }),
      makeTodo({ id: 2, title: "Done todo", completed: true }),
    ];

    render(<TodoFilter todos={todos} />);

    // First click Active to filter, then back to All
    await user.click(screen.getByRole("button", { name: "Active" }));
    await user.click(screen.getByRole("button", { name: "All" }));

    expect(screen.getByText("Active todo")).toBeInTheDocument();
    expect(screen.getByText("Done todo")).toBeInTheDocument();
  });

  // AC-3: Empty state when list is empty
  it("shows empty state when there are no todos (covers: AC-3, AC-5)", () => {
    render(<TodoFilter todos={[]} />);

    expect(screen.getByText("No todos yet. Add one above.")).toBeInTheDocument();
  });
});
