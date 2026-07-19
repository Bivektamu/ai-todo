import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LandingPage } from "@/components/LandingPage";

describe("LandingPage", () => {
  // AC-1: landing page renders all sections
  it("renders the hero section with headline, subcopy, and CTA button (covers: AC-1, AC-3)", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", { name: "Never miss a deadline again" })
    ).toBeDefined();

    expect(
      screen.getByText(/simple, fast todo app/i)
    ).toBeDefined();

    const ctaButtons = screen.getAllByRole("link", { name: "Get started" });
    expect(ctaButtons.length).toBeGreaterThanOrEqual(1);
    expect(ctaButtons[0].getAttribute("href")).toBe("/login");
  });

  // AC-4: three feature cards
  it("renders three feature cards with headings and descriptions (covers: AC-4)", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", { name: "Priorities" })
    ).toBeDefined();
    expect(
      screen.getByText(/colour coded badges/i)
    ).toBeDefined();

    expect(
      screen.getByRole("heading", { name: "Categories" })
    ).toBeDefined();
    expect(
      screen.getByText(/named categories with custom colours/i)
    ).toBeDefined();

    expect(
      screen.getByRole("heading", { name: "Drag & drop" })
    ).toBeDefined();
    expect(
      screen.getByText(/reorder your list by dragging/i)
    ).toBeDefined();
  });

  // AC-4: feature cards use design token colors for icon backgrounds
  it("renders feature card icons with design token color classes (covers: AC-4)", () => {
    render(<LandingPage />);

    // Each feature card has an icon container with color-specific classes
    const iconContainers = document.querySelectorAll(".w-10.h-10.rounded-lg");
    expect(iconContainers.length).toBe(3);

    const classList = Array.from(iconContainers).map((el) => el.className);
    expect(classList.some((c) => c.includes("text-primary"))).toBe(true);
    expect(classList.some((c) => c.includes("text-danger"))).toBe(true);
    expect(classList.some((c) => c.includes("text-success"))).toBe(true);
  });

  // AC-5: secondary CTA
  it("renders the secondary CTA section with heading and button (covers: AC-5)", () => {
    render(<LandingPage />);

    expect(
      screen.getByRole("heading", { name: "Ready to get organized?" })
    ).toBeDefined();

    expect(
      screen.getByText(/start tracking your tasks in seconds/i)
    ).toBeDefined();

    const ctaButtons = screen.getAllByRole("link", { name: "Get started" });
    // Should have at least 2: hero + secondary CTA
    expect(ctaButtons.length).toBe(2);
    expect(ctaButtons[1].getAttribute("href")).toBe("/login");
  });

  // AC-6: footer
  it("renders the footer with copyright, Login link, and GitHub link (covers: AC-6)", () => {
    render(<LandingPage />);

    expect(screen.getByText("© 2026 Todo")).toBeDefined();

    const loginLink = screen.getByRole("link", { name: "Login" });
    expect(loginLink.getAttribute("href")).toBe("/login");

    const gitHubLink = screen.getByRole("link", { name: "GitHub" });
    expect(gitHubLink.getAttribute("href")).toBe("https://github.com");
    expect(gitHubLink.getAttribute("target")).toBe("_blank");
    expect(gitHubLink.getAttribute("rel")).toBe("noopener noreferrer");
  });

  // AC-1: no redirect, full page renders
  it("renders the full landing page structure (covers: AC-1)", () => {
    render(<LandingPage />);

    // Check for each major section by its heading
    expect(
      screen.getByRole("heading", { name: "Never miss a deadline again" })
    ).toBeDefined();
    expect(
      screen.getByRole("heading", { name: "Priorities" })
    ).toBeDefined();
    expect(
      screen.getByRole("heading", { name: "Categories" })
    ).toBeDefined();
    expect(
      screen.getByRole("heading", { name: "Drag & drop" })
    ).toBeDefined();
    expect(
      screen.getByRole("heading", { name: "Ready to get organized?" })
    ).toBeDefined();

    // Footer present
    expect(screen.getByText("© 2026 Todo")).toBeDefined();
  });

  // Accessibility: SVG icons are hidden from screen readers
  it("feature card SVGs have aria-hidden (covers: AC-4)", () => {
    render(<LandingPage />);

    const svgs = document.querySelectorAll("svg[aria-hidden]");
    expect(svgs.length).toBe(3);
    svgs.forEach((svg) => {
      expect(svg.getAttribute("aria-hidden")).toBe("true");
    });
  });

  // Accessibility: CTA links are not nested inside buttons
  it("CTA links are flat anchor elements, not nested buttons", () => {
    render(<LandingPage />);

    const ctaLinks = screen.getAllByRole("link", { name: "Get started" });
    ctaLinks.forEach((link) => {
      expect(link.tagName).toBe("A");
      expect(link.querySelector("button")).toBeNull();
    });
  });
});
