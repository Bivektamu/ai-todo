import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TodoList } from "@/components/TodoList";

vi.mock("@/app/actions", () => ({
  toggleTodo: vi.fn(),
  deleteTodo: vi.fn(),
}));

function makeTodo(overrides: Partial<{
  id: number;
  title: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}> = {}) {
  return {
    id: 1,
    title: "Test todo",
    completed: false,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    ...overrides,
  };
}

describe("TodoList", () => {
  // AC-5: Empty state renders when list is empty
  it("renders empty state when there are no todos (covers: AC-5)", () => {
    render(<TodoList todos={[]} />);

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

    render(<TodoList todos={todos} />);

    expect(screen.getByText("First todo")).toBeInTheDocument();
    expect(screen.getByText("Second todo")).toBeInTheDocument();
  });

  // AC-3: Check it off (visual state)
  it("renders completed todos with line-through styling (covers: AC-3)", () => {
    const todos = [
      makeTodo({ id: 1, title: "Done todo", completed: true }),
    ];

    render(<TodoList todos={todos} />);

    const title = screen.getByText("Done todo");
    expect(title).toHaveClass("line-through");
  });

  it("renders incomplete todos without line-through styling", () => {
    const todos = [
      makeTodo({ id: 1, title: "Pending todo", completed: false }),
    ];

    render(<TodoList todos={todos} />);

    const title = screen.getByText("Pending todo");
    expect(title).not.toHaveClass("line-through");
  });

  it("renders a toggle button for each todo", () => {
    const todos = [
      makeTodo({ id: 1, title: "Todo 1" }),
      makeTodo({ id: 2, title: "Todo 2" }),
    ];

    render(<TodoList todos={todos} />);

    expect(
      screen.getAllByRole("button", { name: "Mark complete" })
    ).toHaveLength(2);
  });

  it("renders correct aria-label on toggle for completed todo", () => {
    const todos = [
      makeTodo({ id: 1, title: "Done", completed: true }),
    ];

    render(<TodoList todos={todos} />);

    expect(
      screen.getByRole("button", { name: "Mark incomplete" })
    ).toBeInTheDocument();
  });

  it("renders a delete button for each todo", () => {
    const todos = [makeTodo({ id: 1, title: "Delete me" })];

    render(<TodoList todos={todos} />);

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

    render(<TodoList todos={todos} />);

    expect(screen.getAllByRole("button", { name: "Mark complete" })).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: "Delete todo" })).toHaveLength(3);
  });
});
