import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "@/components/ui/Badge";

describe("Badge", () => {
  it("renders children", () => {
    render(<Badge>Category</Badge>);
    expect(screen.getByText("Category")).toBeInTheDocument();
  });

  it("applies color via style prop", () => {
    render(<Badge color="#3B82F6">Blue</Badge>);
    const badge = screen.getByText("Blue");
    expect(badge.style.backgroundColor).toBe("rgb(59, 130, 246)");
  });

  it("applies className override", () => {
    render(<Badge className="text-white">White</Badge>);
    const badge = screen.getByText("White");
    expect(badge.className).toContain("text-white");
  });

  it("merges custom style with color", () => {
    render(<Badge color="#EF4444" style={{ fontWeight: "bold" }}>Bold</Badge>);
    const badge = screen.getByText("Bold");
    expect(badge.style.backgroundColor).toBe("rgb(239, 68, 68)");
    expect(badge.style.fontWeight).toBe("bold");
  });
});
