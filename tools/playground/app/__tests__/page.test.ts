import { describe, expect, it, vi } from "vitest";

const { redirect } = vi.hoisted(() => ({
  redirect: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect,
}));

import Home from "../page";

describe("Home", () => {
  it("redirects the root route to /playground", () => {
    Home();

    expect(redirect).toHaveBeenCalledWith("/playground");
  });
});
