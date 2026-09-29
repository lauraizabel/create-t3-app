import type { FeatureId, ProjectManifest } from "./project-manifest";

type Option = { id: string; label: string; description: string; available: boolean; cost?: string };

export const catalog: Record<string, Option[]> = {
  frontend: [
    { id: "nextjs", label: "Next.js", description: "App Router, React and TypeScript", available: true },
    { id: "react-vite", label: "React + Vite", description: "Planned adapter", available: false },
    { id: "vue", label: "Vue", description: "Planned adapter", available: false },
    { id: "angular", label: "Angular", description: "Planned adapter", available: false },
  ],
  backend: [
    { id: "nextjs", label: "Next.js API", description: "One deployable full-stack application", available: true },
    { id: "nestjs", label: "NestJS", description: "Separate API and web applications", available: true },
    { id: "express", label: "Express", description: "Planned adapter", available: false },
    { id: "dotnet", label: "ASP.NET Core", description: "Planned adapter", available: false },
  ],
  database: [
    { id: "postgresql", label: "PostgreSQL", description: "Relational database", available: true },
    { id: "mysql", label: "MySQL", description: "Planned adapter", available: false },
    { id: "mongodb", label: "MongoDB", description: "Planned adapter", available: false },
  ],
  orm: [
    { id: "prisma", label: "Prisma", description: "Type-safe database client and migrations", available: true },
    { id: "drizzle", label: "Drizzle", description: "Planned adapter", available: false },
    { id: "typeorm", label: "TypeORM", description: "Planned adapter", available: false },
  ],
  auth: [
    { id: "authjs", label: "Auth.js", description: "Database sessions with GitHub OAuth", available: true },
    { id: "supabase", label: "Supabase Auth", description: "Cookie-based SSR authentication", available: true, cost: "Supabase plan and usage" },
    { id: "clerk", label: "Clerk", description: "Planned adapter", available: false },
    { id: "none", label: "No authentication", description: "Planned for feature-free projects", available: false },
  ],
  billing: [
    { id: "none", label: "No billing", description: "No payment provider", available: true },
    { id: "stripe", label: "Stripe", description: "Checkout and signed webhooks", available: true, cost: "Stripe transaction fees" },
    { id: "asaas", label: "Asaas", description: "Planned adapter", available: false },
  ],
  ui: [
    { id: "tailwind", label: "Tailwind CSS", description: "Utility-first styling", available: true },
    { id: "shadcn", label: "shadcn/ui", description: "Tailwind-based accessible components", available: true },
    { id: "mui", label: "Material UI", description: "Planned adapter", available: false },
  ],
  deploy: [
    { id: "manual", label: "Manual", description: "Run with Node.js and PostgreSQL", available: true },
    { id: "docker", label: "Docker", description: "Dockerfiles and local Compose", available: true },
    { id: "vercel", label: "Vercel", description: "Planned integration", available: false },
  ],
};

export const featureCatalog: Record<FeatureId, { label: string; description: string; cost?: string }> = {
  authentication: { label: "Authentication", description: "Sign-in, sign-out and protected routes" },
  organizations: { label: "Organizations", description: "Shared workspaces and membership" },
  rbac: { label: "RBAC", description: "Owner, admin and member roles" },
  trial: { label: "Free trial", description: "Time-limited product access" },
  subscriptions: { label: "Subscriptions", description: "Recurring plans and billing state", cost: "Stripe transaction fees" },
  "feature-flags": { label: "Feature flags", description: "Per-organization feature switches" },
};

export function expectedStructure(manifest: ProjectManifest) {
  return manifest.backend === "nestjs"
    ? ["apps/web/", "apps/api/", "packages/database/", "README.md", ".env.example"]
    : ["src/app/", "src/lib/", "prisma/", "README.md", ".env.example"];
}
