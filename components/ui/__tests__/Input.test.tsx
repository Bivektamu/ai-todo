import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "@/components/ui/Input";

describe("Input", () => {
  it("renders a text input by default", () => {
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText("Enter text");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "text");
  });

  it("renders a date input", () => {
    render(<Input type="date" aria-label="Date" />);
    expect(screen.getByLabelText("Date")).toHaveAttribute("type", "date");
  });

  it("accepts user input", async () => {
    render(<Input placeholder="Type here" />);
    const input = screen.getByPlaceholderText("Type here");
    await userEvent.type(input, "hello");
    expect(input).toHaveValue("hello");
  });

  it("applies className override", () => {
    render(<Input className="custom-input" placeholder="Custom" />);
    expect(screen.getByPlaceholderText("Custom").className).toContain("custom-input");
  });

  it("passes name attribute through", () => {
    render(<Input name="email" placeholder="Email" />);
    expect(screen.getByPlaceholderText("Email")).toHaveAttribute("name", "email");
  });

  it("is disabled when disabled prop is set", () => {
    render(<Input disabled placeholder="Disabled" />);
    expect(screen.getByPlaceholderText("Disabled")).toBeDisabled();
  });

  it("has required attribute when set", () => {
    render(<Input required placeholder="Required" />);
    expect(screen.getByPlaceholderText("Required")).toBeRequired();
  });
});
