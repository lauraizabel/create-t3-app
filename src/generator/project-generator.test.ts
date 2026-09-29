import { describe, expect, it } from "vitest";
import { defaultManifest } from "@/core/project-manifest";
import { ProjectGenerator } from "./project-generator";

describe("ProjectGenerator", () => {
  it("composes an integrated Next.js project", () => {
    const result = new ProjectGenerator().generate({ ...defaultManifest, features: ["authentication", "organizations", "rbac"] });
    expect(result.files.has("src/app/page.tsx")).toBe(true);
    expect(result.files.get("prisma/schema.prisma")).toContain("model Organization");
    expect(result.files.get("project-manifest.json")).toContain('"backend": "nextjs"');
  });

  it("composes a separate NestJS project", () => {
    const result = new ProjectGenerator().generate({ ...defaultManifest, backend: "nestjs", auth: "supabase" });
    expect(result.files.has("apps/web/src/app/page.tsx")).toBe(true);
    expect(result.files.has("apps/api/src/main.ts")).toBe(true);
    expect(result.files.has("packages/database/prisma/schema.prisma")).toBe(true);
  });
});
