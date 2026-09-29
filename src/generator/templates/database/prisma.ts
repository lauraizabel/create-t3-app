import type { ProjectManifest } from "@/core/project-manifest";
import type { ModuleContribution } from "../../types";
import { basePrismaModels } from "../common";

export const prismaAdapter = {
  id: "prisma",
  contribute(manifest: ProjectManifest): ModuleContribution {
    const clientPath = manifest.backend === "nestjs" ? "packages/database/src/client.ts" : "src/lib/db.ts";
    return {
      dependencies: { "@prisma/client": "6.12.0" },
      devDependencies: { prisma: "6.12.0" },
      prismaModels: basePrismaModels(manifest),
      files: {
        [clientPath]: `import { PrismaClient } from "@prisma/client";\n\nconst globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };\nexport const db = globalForPrisma.prisma ?? new PrismaClient();\nif (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;\n`,
        ...(manifest.backend === "nestjs" ? { "packages/database/src/index.ts": 'export { db } from "./client";\n' } : {}),
      },
      readme: ["## Database", "Run `npm run db:migrate` to create and apply a development migration."],
    };
  },
};

export function renderPrismaSchema(models: string[]) {
  return `generator client {\n  provider = "prisma-client-js"\n}\n\ndatasource db {\n  provider = "postgresql"\n  url      = env("DATABASE_URL")\n}\n\n${models.join("\n\n")}\n`;
}
