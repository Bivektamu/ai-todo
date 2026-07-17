import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TodoList } from "@/components/TodoList";

vi.mock("@/app/actions", () => ({
  toggleTodo: vi.fn(),
  deleteTodo: vi.fn(),
  updateTodo: vi.fn(),
}));

const noop = () => {};

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

describe("TodoList", () => {
  // AC-5: Empty state renders when list is empty
  it("renders empty state when there are no todos (covers: AC-5)", () => {
    render(<TodoList isCustomSort={false} onReorder={noop} categories={[]} todos={[]} />);

    expect(
      screen.getByText("No todos yet. Add one above.")
    ).toBeInTheDocument();
  });

  // AC-2: See it appear in the list
  it("renders todo titles in the list (covers: AC-2)", () => {
    const todos = [
      makeTodo({ id: 1, title: "First todo" }),
      makeTodo({ id: 2, title: "Second todo" }),
    ];

    render(<TodoList isCustomSort={false} onReorder={noop} categories={[]} todos={todos} />);

    expect(screen.getByText("First todo")).toBeInTheDocument();
    expect(screen.getByText("Second todo")).toBeInTheDocument();
  });

  // AC-3: Check it off (visual state)
  it("renders completed todos with line-through styling (covers: AC-3)", () => {
    const todos = [
      makeTodo({ id: 1, title: "Done todo", completed: true }),
    ];

    render(<TodoList isCustomSort={false} onReorder={noop} categories={[]} todos={todos} />);

    const title = screen.getByText("Done todo");
    expect(title).toHaveClass("line-through");
  });

  it("renders incomplete todos without line-through styling", () => {
    const todos = [
      makeTodo({ id: 1, title: "Pending todo", completed: false }),
    ];

    render(<TodoList isCustomSort={false} onReorder={noop} categories={[]} todos={todos} />);

    const title = screen.getByText("Pending todo");
    expect(title).not.toHaveClass("line-through");
  });

  it("renders a toggle button for each todo", () => {
    const todos = [
      makeTodo({ id: 1, title: "Todo 1" }),
      makeTodo({ id: 2, title: "Todo 2" }),
    ];

    render(<TodoList isCustomSort={false} onReorder={noop} categories={[]} todos={todos} />);

    expect(
      screen.getAllByRole("button", { name: "Mark complete" })
    ).toHaveLength(2);
  });

  it("renders correct aria-label on toggle for completed todo", () => {
    const todos = [
      makeTodo({ id: 1, title: "Done", completed: true }),
    ];

    render(<TodoList isCustomSort={false} onReorder={noop} categories={[]} todos={todos} />);

    expect(
      screen.getByRole("button", { name: "Mark incomplete" })
    ).toBeInTheDocument();
  });

  it("renders a delete button for each todo", () => {
    const todos = [makeTodo({ id: 1, title: "Delete me" })];

    render(<TodoList isCustomSort={false} onReorder={noop} categories={[]} todos={todos} />);

    expect(
      screen.getByRole("button", { name: "Delete todo" })
    ).toBeInTheDocument();
  });

  it("renders both toggle and delete for every todo", () => {
    const todos = [
      makeTodo({ id: 1, title: "A" }),
      makeTodo({ id: 2, title: "B" }),
      makeTodo({ id: 3, title: "C" }),
    ];

    render(<TodoList isCustomSort={false} onReorder={noop} categories={[]} todos={todos} />);

    expect(screen.getAllByRole("button", { name: "Mark complete" })).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: "Delete todo" })).toHaveLength(3);
  });

  // AC-2: Priority badge rendering
  it("renders a priority badge with the correct label (covers: AC-2)", () => {
    const todos = [
      makeTodo({ id: 1, title: "High prio", priority: "HIGH" }),
    ];

    render(<TodoList isCustomSort={false} onReorder={noop} categories={[]} todos={todos} />);

    // The badge text "High" also appears in the inline dropdown option;
    // scope to the badge span by checking the element's tag and class.
    const badges = screen.getAllByText("High");
    const badge = badges.find(
      (el) => el.tagName === "SPAN" && el.className.includes("rounded-full")
    );
    expect(badge).toBeInTheDocument();
  });

  it("renders Medium badge by default (covers: AC-2, AC-5)", () => {
    const todos = [makeTodo({ id: 1, title: "Default prio" })];

    render(<TodoList isCustomSort={false} onReorder={noop} categories={[]} todos={todos} />);

    const badges = screen.getAllByText("Medium");
    const badge = badges.find(
      (el) => el.tagName === "SPAN" && el.className.includes("rounded-full")
    );
    expect(badge).toBeInTheDocument();
  });

  // AC-1: Due date display (use a future date so it's not overdue)
  it("renders a due date when present (covers: AC-1)", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    future.setUTCHours(0, 0, 0, 0);

    const todos = [
      makeTodo({ id: 1, title: "Dated", dueDate: future }),
    ];

    render(<TodoList isCustomSort={false} onReorder={noop} categories={[]} todos={todos} />);

    const dateStr = future.toISOString().slice(0, 10);
    expect(screen.getByText(dateStr)).toBeInTheDocument();
  });

  it("does not render a due date when null (covers: AC-5)", () => {
    const todos = [makeTodo({ id: 1, title: "No date" })];

    render(<TodoList isCustomSort={false} onReorder={noop} categories={[]} todos={todos} />);

    expect(screen.queryByText(/\d{4}-\d{2}-\d{2}/)).not.toBeInTheDocument();
  });

  // AC-1: Overdue highlighting
  it("marks past due dates as overdue (covers: AC-1)", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setUTCHours(0, 0, 0, 0);

    const todos = [
      makeTodo({ id: 1, title: "Late", dueDate: yesterday }),
    ];

    render(<TodoList isCustomSort={false} onReorder={noop} categories={[]} todos={todos} />);

    expect(screen.getByText(/Overdue:/)).toBeInTheDocument();
  });

  // AC-4: Inline editing controls
  it("renders a priority dropdown for each todo (covers: AC-4)", () => {
    const todos = [makeTodo({ id: 1, title: "Edit me" })];

    render(<TodoList isCustomSort={false} onReorder={noop} categories={[]} todos={todos} />);

    expect(screen.getByRole("combobox", { name: "Change priority" })).toBeInTheDocument();
  });

  it("renders a date input for each todo (covers: AC-4)", () => {
    const todos = [makeTodo({ id: 1, title: "Edit me" })];

    render(<TodoList isCustomSort={false} onReorder={noop} categories={[]} todos={todos} />);

    // The date input has aria-label "Change due date"
    const dateInput = screen.getByLabelText("Change due date");
    expect(dateInput).toBeInTheDocument();
    expect(dateInput).toHaveAttribute("type", "date");
  });

  // AC-2: Drag handles appear only in Custom sort mode
  it("renders drag handles when isCustomSort is true (covers: AC-2, AC-4)", () => {
    const todos = [
      makeTodo({ id: 1, title: "First" }),
      makeTodo({ id: 2, title: "Second" }),
    ];

    render(<TodoList isCustomSort={true} onReorder={noop} categories={[]} todos={todos} />);

    const handles = screen.getAllByRole("button", { name: "Drag to reorder" });
    expect(handles).toHaveLength(2);
  });

  it("does not render drag handles when isCustomSort is false (covers: AC-2)", () => {
    const todos = [makeTodo({ id: 1, title: "Only" })];

    render(<TodoList isCustomSort={false} onReorder={noop} categories={[]} todos={todos} />);

    expect(
      screen.queryByRole("button", { name: "Drag to reorder" })
    ).not.toBeInTheDocument();
  });

  // AC-2: Non-custom sort still renders toggle and delete for every todo
  it("renders toggle and delete for every todo in custom sort mode (covers: AC-2)", () => {
    const todos = [
      makeTodo({ id: 1, title: "A" }),
      makeTodo({ id: 2, title: "B" }),
    ];

    render(<TodoList isCustomSort={true} onReorder={noop} categories={[]} todos={todos} />);

    expect(screen.getAllByRole("button", { name: "Mark complete" })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Delete todo" })).toHaveLength(2);
  });
});
