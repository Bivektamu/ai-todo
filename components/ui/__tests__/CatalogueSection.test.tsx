import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CatalogueSection } from "@/components/ui/CatalogueSection";

describe("CatalogueSection", () => {
  // AC-1: renders title and children
  it("renders the title and children (covers: AC-1, AC-4)", () => {
    render(
      <CatalogueSection title="Test Section">
        <p>Section content</p>
      </CatalogueSection>
    );

    expect(screen.getByText("Test Section")).toBeInTheDocument();
    expect(screen.getByText("Section content")).toBeInTheDocument();
  });

  // AC-1: renders as a semantic section
  it("renders as a semantic section element (covers: AC-1)", () => {
    render(
      <CatalogueSection title="Semantic">
        <span>child</span>
      </CatalogueSection>
    );

    const section = screen.getByText("Semantic").closest("section");
    expect(section).toBeInTheDocument();
  });

  // AC-3: applies token based styling
  it("applies design token classes to the wrapper (covers: AC-3)", () => {
    render(
      <CatalogueSection title="Styled">
        <span>child</span>
      </CatalogueSection>
    );

    const wrapper = screen.getByText("child").parentElement;
    expect(wrapper?.className).toContain("border-border");
    expect(wrapper?.className).toContain("bg-surface");
  });
});
