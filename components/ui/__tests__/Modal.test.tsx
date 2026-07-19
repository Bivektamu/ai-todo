import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "@/components/ui/Modal";

describe("Modal", () => {
  it("renders when open is true", () => {
    render(
      <Modal open onClose={vi.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText("Modal content")).toBeInTheDocument();
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
  });

  it("does not render when open is false", () => {
    render(
      <Modal open={false} onClose={vi.fn()} title="Hidden">
        <p>Should not appear</p>
      </Modal>
    );
    expect(screen.queryByText("Should not appear")).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Closable">
        <p>Content</p>
      </Modal>
    );
    await userEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Escape is pressed", async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Escapable">
        <p>Content</p>
      </Modal>
    );
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("has correct accessibility attributes", () => {
    render(
      <Modal open onClose={vi.fn()} title="Accessible">
        <p>Content</p>
      </Modal>
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-label", "Accessible");
  });

  it("renders without title", () => {
    render(
      <Modal open onClose={vi.fn()}>
        <p>No title modal</p>
      </Modal>
    );
    expect(screen.getByText("No title modal")).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  // Accessibility: focus trap — Tab cycles within focusable elements
  it("traps focus inside the modal when Tab is pressed", async () => {
    const user = userEvent.setup();
    render(
      <Modal open onClose={vi.fn()} title="Focus Trap">
        <button type="button">First</button>
        <button type="button">Last</button>
      </Modal>
    );

    const firstBtn = screen.getByRole("button", { name: "First" });
    const lastBtn = screen.getByRole("button", { name: "Last" });
    const closeBtn = screen.getByLabelText("Close");

    // Focus the last button, press Tab — should cycle back to first focusable (close button)
    lastBtn.focus();
    await user.tab();
    // After Tab from last, focus should go to first (close button is first in DOM)
    expect(closeBtn).toHaveFocus();
  });

  it("wraps focus back to last element on Shift+Tab from first", async () => {
    const user = userEvent.setup();
    render(
      <Modal open onClose={vi.fn()} title="Focus Trap">
        <button type="button">First</button>
        <button type="button">Last</button>
      </Modal>
    );

    const closeBtn = screen.getByLabelText("Close");
    const lastBtn = screen.getByRole("button", { name: "Last" });

    // Focus the close button (first focusable), press Shift+Tab — should wrap to last
    closeBtn.focus();
    await user.tab({ shift: true });
    expect(lastBtn).toHaveFocus();
  });
});
