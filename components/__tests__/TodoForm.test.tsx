import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TodoForm } from "@/components/TodoForm";

vi.mock("@/app/actions", () => ({
  createTodo: vi.fn(),
}));

describe("TodoForm", () => {
  it("renders an input and a submit button", () => {
    render(<TodoForm />);

    expect(
      screen.getByPlaceholderText("What needs to be done?")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });

  it("input has the required attribute", () => {
    render(<TodoForm />);

    const input = screen.getByPlaceholderText("What needs to be done?");
    expect(input).toBeRequired();
  });

  it("input has name 'title'", () => {
    render(<TodoForm />);

    const input = screen.getByPlaceholderText("What needs to be done?");
    expect(input).toHaveAttribute("name", "title");
  });

  it("renders a form element with correct classes", () => {
    render(<TodoForm />);

    const form = screen.getByRole("textbox").closest("form");
    expect(form).toHaveClass("flex", "flex-col", "gap-3");
  });

  // AC-2: Priority select in creation form
  it("renders a priority dropdown with three options (covers: AC-2)", () => {
    render(<TodoForm />);

    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("Low");
    expect(options[1]).toHaveTextContent("Medium");
    expect(options[2]).toHaveTextContent("High");
  });

  it("priority select defaults to MEDIUM (covers: AC-2)", () => {
    const { container } = render(<TodoForm />);

    const select = container.querySelector('select[name="priority"]') as HTMLSelectElement;
    expect(select).not.toBeNull();
    expect(select.value).toBe("MEDIUM");
  });

  // AC-1: Due date input in creation form
  it("renders a date input for due date (covers: AC-1)", () => {
    const { container } = render(<TodoForm />);

    const dateInput = container.querySelector('input[type="date"]') as HTMLInputElement;
    expect(dateInput).not.toBeNull();
    expect(dateInput).toHaveAttribute("name", "dueDate");
  });
});
