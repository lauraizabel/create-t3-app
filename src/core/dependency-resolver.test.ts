import { describe, expect, it } from "vitest";
import { defaultManifest } from "./project-manifest";
import { DependencyResolver } from "./dependency-resolver";

describe("DependencyResolver", () => {
  it("adds transitive trial requirements", () => {
    const result = new DependencyResolver().resolve({ ...defaultManifest, billing: "stripe", features: ["trial"] });
    expect(result.errors).toEqual([]);
    expect(result.manifest.features).toEqual(expect.arrayContaining(["trial", "subscriptions", "organizations", "authentication"]));
  });

  it("rejects subscriptions without Stripe", () => {
    const result = new DependencyResolver().resolve({ ...defaultManifest, billing: "none", features: ["subscriptions"] });
    expect(result.errors).toContain("Subscriptions require Stripe as the billing provider.");
  });

  it("rejects Auth.js with the NestJS adapter", () => {
    const result = new DependencyResolver().resolve({ ...defaultManifest, backend: "nestjs", auth: "authjs" });
    expect(result.errors[0]).toMatch(/NestJS/);
  });
});
