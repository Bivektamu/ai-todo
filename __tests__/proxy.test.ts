import { describe, it, expect, vi, beforeEach } from "vitest";// @ts-nocheck -- mock types don't match NextResponse internal signatures
const mockAuthFn = vi.fn();

vi.mock("@/auth", () => ({
  auth: (...args: any[]) => mockAuthFn(...args),
}));

vi.mock("next/server", () => ({
  NextResponse: {
    redirect: vi.fn((url: string | URL, _init?: number | ResponseInit) => ({
      type: "redirect" as const,
      url: url.toString(),
    })),
    next: vi.fn(() => ({ type: "next" as const })),
  },
}));

import { NextResponse } from "next/server";

describe("proxy.ts (route protection)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports a config with a matcher array (covers: AC-5)", async () => {
    const mod = await import("@/proxy");
    expect(mod.config).toBeDefined();
    expect(mod.config.matcher).toBeDefined();
    expect(Array.isArray(mod.config.matcher)).toBe(true);
  });

  it("matcher excludes api/auth, login, _next/static, _next/image, and favicon.ico (covers: AC-5)", async () => {
    const mod = await import("@/proxy");
    const matcher = mod.config.matcher[0];
    // Should be a regex pattern that excludes auth routes
    expect(matcher).toContain("api/auth");
    expect(matcher).toContain("login");
    expect(matcher).toContain("_next/static");
    expect(matcher).toContain("_next/image");
    expect(matcher).toContain("favicon.ico");
  });

  it("redirects unauthenticated requests to /login (covers: AC-5)", async () => {
    // Reset module to clear cached import
    vi.resetModules();
    vi.doMock("@/auth", () => ({
      auth: (...args: any[]) => {
        const handler = args[0] as (req: any) => any;
        return async (req: any) => {
          // Simulate no auth
          Object.defineProperty(req, "auth", { value: null });
          return handler(req);
        };
      },
    }));

    const proxyMod = await import("@/proxy");
    const handler = proxyMod.default;

    const mockReq = {
      url: "http://localhost:3000/some-page",
      auth: null,
    };

    const result = await handler(mockReq);

    expect(NextResponse.redirect as any).toHaveBeenCalled();
    const redirectArg = (NextResponse.redirect as any).mock.calls[0][0];
    expect(redirectArg.toString()).toContain("/login");
  });

  it("allows authenticated requests through (covers: AC-5)", async () => {
    vi.resetModules();
    vi.doMock("@/auth", () => ({
      auth: (...args: any[]) => {
        const handler = args[0] as (req: any) => any;
        return async (req: any) => {
          // Simulate authenticated
          Object.defineProperty(req, "auth", { value: { user: { id: "1" } } });
          return handler(req);
        };
      },
    }));

    const proxyMod = await import("@/proxy");
    const handler = proxyMod.default;

    const mockReq = {
      url: "http://localhost:3000/",
      auth: { user: { id: "1" } },
    };

    const result = await handler(mockReq);

    expect(NextResponse.next as any).toHaveBeenCalled();
  });
});
