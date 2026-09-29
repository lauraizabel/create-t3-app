import type { ProjectManifest } from "@/core/project-manifest";
import type { ModuleContribution } from "../types";

export function commonTemplate(manifest: ProjectManifest): ModuleContribution {
  const isMonorepo = manifest.backend === "nestjs";
  return {
    files: {
      ".gitignore": "node_modules\n.next\ndist\ncoverage\n.env\n",
      ".prettierrc": '{"semi": true, "singleQuote": false}\n',
      "eslint.config.mjs": 'import { defineConfig, globalIgnores } from "eslint/config";\nimport nextVitals from "eslint-config-next/core-web-vitals";\nimport nextTs from "eslint-config-next/typescript";\nexport default defineConfig([...nextVitals, ...nextTs, { rules: { "@next/next/no-html-link-for-pages": "off" } }, globalIgnores(["**/.next/**", "**/dist/**", "coverage/**"])]);\n',
      "project-manifest.json": `${JSON.stringify(manifest, null, 2)}\n`,
      ...(manifest.deploy === "docker" ? { "docker-compose.yml": composeFile(isMonorepo) } : {}),
    },
    env: { DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/app?schema=public" },
    readme: [
      "## Developer experience",
      "TypeScript strict mode, ESLint, Prettier, Zod environment validation, Prisma migrations, and basic tests are configured.",
    ],
  };
}

function composeFile(monorepo: boolean) {
  const app = monorepo
    ? `\n  api:\n    build:\n      context: .\n      dockerfile: apps/api/Dockerfile\n    env_file: .env\n    ports:\n      - \"3001:3001\"\n    depends_on:\n      postgres:\n        condition: service_healthy\n  web:\n    build:\n      context: .\n      dockerfile: apps/web/Dockerfile\n    env_file: .env\n    ports:\n      - \"3000:3000\"\n    depends_on:\n      - api\n`
    : `\n  app:\n    build: .\n    env_file: .env\n    ports:\n      - \"3000:3000\"\n    depends_on:\n      postgres:\n        condition: service_healthy\n`;
  return `services:${app}  postgres:\n    image: postgres:17-alpine\n    environment:\n      POSTGRES_PASSWORD: postgres\n      POSTGRES_DB: app\n    ports:\n      - \"5432:5432\"\n    healthcheck:\n      test: [\"CMD-SHELL\", \"pg_isready -U postgres\"]\n      interval: 5s\n      timeout: 5s\n      retries: 10\n    volumes:\n      - postgres_data:/var/lib/postgresql/data\nvolumes:\n  postgres_data:\n`;
}

export function basePrismaModels(manifest: ProjectManifest) { return [`model User {
  id          String       @id @default(cuid())
  email       String       @unique
${manifest.auth === "authjs" ? "  emailVerified DateTime?" : ""}
  name        String?
  image       String?
${manifest.features.includes("organizations") ? "  memberships Membership[]" : ""}
${manifest.auth === "authjs" ? "  accounts    Account[]\n  sessions    Session[]" : ""}
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}`]; }
