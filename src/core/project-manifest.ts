import { z } from "zod";

export const featureIds = [
  "authentication",
  "organizations",
  "rbac",
  "trial",
  "subscriptions",
  "feature-flags",
] as const;

export const projectManifestSchema = z.object({
  version: z.literal(1).default(1),
  project: z.object({
    name: z.string().trim().min(2).max(50).regex(/^[a-z][a-z0-9-]*$/),
    description: z.string().trim().max(160).default("A generated SaaS application"),
  }),
  frontend: z.literal("nextjs"),
  backend: z.enum(["nextjs", "nestjs"]),
  database: z.literal("postgresql"),
  orm: z.literal("prisma"),
  auth: z.enum(["supabase", "authjs"]),
  ui: z.enum(["tailwind", "shadcn"]),
  billing: z.enum(["stripe", "none"]),
  email: z.literal("none").default("none"),
  deploy: z.enum(["docker", "manual"]),
  features: z.array(z.enum(featureIds)).default([]),
});

export type ProjectManifest = z.infer<typeof projectManifestSchema>;
export type FeatureId = (typeof featureIds)[number];

export const defaultManifest: ProjectManifest = {
  version: 1,
  project: { name: "my-saas", description: "A generated SaaS application" },
  frontend: "nextjs",
  backend: "nextjs",
  database: "postgresql",
  orm: "prisma",
  auth: "authjs",
  ui: "tailwind",
  billing: "none",
  email: "none",
  deploy: "manual",
  features: ["authentication"],
};
