import { DependencyResolver } from "@/core/dependency-resolver";
import { projectManifestSchema, type ProjectManifest } from "@/core/project-manifest";
import { ModuleRegistry } from "./registry";
import { commonTemplate } from "./templates/common";
import { renderPrismaSchema } from "./templates/database/prisma";
import type { FileMap, GenerationResult, ModuleContribution } from "./types";

export class ProjectGenerator {
  constructor(private readonly registry = new ModuleRegistry(), private readonly resolver = new DependencyResolver()) {}

  generate(input: unknown): GenerationResult {
    const parsed = projectManifestSchema.parse(input);
    const resolution = this.resolver.resolve(parsed);
    if (resolution.errors.length) throw new Error(resolution.errors.join(" "));
    const manifest = resolution.manifest;
    const adapters = [
      this.registry.get("frontend", manifest.frontend),
      this.registry.get("backend", manifest.backend),
      this.registry.get("database", manifest.orm),
      this.registry.get("auth", manifest.auth),
      this.registry.get("billing", manifest.billing),
      ...manifest.features.map((id) => this.registry.features[id]),
    ];
    const moduleIds = adapters.map((adapter) => adapter.id);
    const contributions = [commonTemplate(manifest), ...adapters.map((adapter) => adapter.contribute(manifest))];
    return { files: compose(manifest, contributions), manifest, moduleIds };
  }
}

function compose(manifest: ProjectManifest, contributions: ModuleContribution[]): FileMap {
  const files: FileMap = new Map();
  const dependencies: Record<string, string> = {};
  const devDependencies: Record<string, string> = {};
  const env: Record<string, string> = {};
  const models: string[] = [];
  const readme: string[] = [];

  for (const contribution of contributions) {
    mergeVersions(dependencies, contribution.dependencies ?? {});
    mergeVersions(devDependencies, contribution.devDependencies ?? {});
    Object.assign(env, contribution.env);
    models.push(...(contribution.prismaModels ?? []));
    readme.push(...(contribution.readme ?? []));
    for (const [path, content] of Object.entries(contribution.files ?? {})) {
      if (files.has(path)) throw new Error(`Template conflict: ${path} is produced by more than one module.`);
      files.set(path, content);
    }
  }

  const prismaPath = manifest.backend === "nestjs" ? "packages/database/prisma/schema.prisma" : "prisma/schema.prisma";
  files.set(prismaPath, renderPrismaSchema(models));
  files.set(".env.example", Object.entries(env).map(([key, value]) => `${key}=${value}`).join("\n") + "\n");
  files.set("README.md", renderReadme(manifest, readme));
  files.set("package.json", renderPackageJson(manifest, dependencies, devDependencies, prismaPath));
  return files;
}

function mergeVersions(target: Record<string, string>, source: Record<string, string>) {
  for (const [name, version] of Object.entries(source)) {
    if (target[name] && target[name] !== version) throw new Error(`Package version conflict for ${name}: ${target[name]} vs ${version}.`);
    target[name] = version;
  }
}

function renderPackageJson(manifest: ProjectManifest, dependencies: Record<string, string>, devDependencies: Record<string, string>, prismaPath: string) {
  const monorepo = manifest.backend === "nestjs";
  const scripts = monorepo
    ? { dev: "npm run dev -w apps/web", "dev:api": "npm run dev -w apps/api", build: "npm run build -w apps/web && npm run build -w apps/api", test: "vitest run", lint: "eslint .", format: "prettier --write .", "db:generate": `prisma generate --schema ${prismaPath}`, "db:migrate": `prisma migrate dev --schema ${prismaPath}` }
    : { dev: "next dev", build: "next build", start: "next start", test: "vitest run", lint: "eslint .", format: "prettier --write .", "db:generate": `prisma generate --schema ${prismaPath}`, "db:migrate": `prisma migrate dev --schema ${prismaPath}` };
  return JSON.stringify({ name: manifest.project.name, version: "0.1.0", private: true, ...(monorepo ? { workspaces: ["apps/*", "packages/*"] } : {}), scripts, dependencies, devDependencies }, null, 2) + "\n";
}

function renderReadme(manifest: ProjectManifest, sections: string[]) {
  const architecture = manifest.backend === "nestjs" ? "Next.js frontend + NestJS API" : "Full-stack Next.js";
  return `# ${manifest.project.name}\n\n${manifest.project.description}\n\nGenerated from \`project-manifest.json\`.\n\n## Stack\n\n- Architecture: ${architecture}\n- Database: PostgreSQL + Prisma\n- Authentication: ${manifest.auth === "authjs" ? "Auth.js" : "Supabase Auth"}\n- UI: ${manifest.ui === "shadcn" ? "shadcn/ui + Tailwind CSS" : "Tailwind CSS"}\n- Billing: ${manifest.billing === "stripe" ? "Stripe" : "None"}\n- Features: ${manifest.features.join(", ")}\n\n## Setup\n\n1. Copy \`.env.example\` to \`.env\` and replace placeholder values.\n2. Run \`npm install\`.\n3. Run \`npm run db:migrate\`.\n4. Run \`npm run dev\`${manifest.backend === "nestjs" ? " and, in another terminal, `npm run dev:api`" : ""}.\n\n${sections.join("\n\n")}\n`;
}
