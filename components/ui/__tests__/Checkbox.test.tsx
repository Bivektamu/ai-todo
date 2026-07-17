import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "@/components/ui/Checkbox";

describe("Checkbox", () => {
  it("renders unchecked by default", () => {
    render(<Checkbox aria-label="Toggle" />);
    const checkbox = screen.getByRole("checkbox", { name: "Toggle" });
    expect(checkbox).not.toBeChecked();
  });

  it("renders checked when defaultChecked is set", () => {
    render(<Checkbox defaultChecked aria-label="Checked" />);
    expect(screen.getByRole("checkbox", { name: "Checked" })).toBeChecked();
  });

  it("fires onChange when clicked", async () => {
    const onChange = vi.fn();
    render(<Checkbox onChange={onChange} aria-label="Click me" />);
    await userEvent.click(screen.getByRole("checkbox", { name: "Click me" }));
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("toggles checked state on click", async () => {
    render(<Checkbox aria-label="Toggle" />);
    const checkbox = screen.getByRole("checkbox", { name: "Toggle" });
    expect(checkbox).not.toBeChecked();
    await userEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });
});
