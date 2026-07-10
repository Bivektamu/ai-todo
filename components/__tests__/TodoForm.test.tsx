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
    expect(form).toHaveClass("flex", "gap-2");
  });
});
