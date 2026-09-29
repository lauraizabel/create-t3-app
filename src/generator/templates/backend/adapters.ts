import type { TechnologyAdapter } from "../../types";

export const nextJsBackendAdapter: TechnologyAdapter = {
  id: "nextjs",
  contribute() {
    return {
      files: {
        "src/app/api/status/route.ts": 'export function GET() { return Response.json({ service: "api", status: "ready" }); }\n',
      },
      readme: ["## Architecture", "The Next.js application contains the UI and server-side API in one deployable unit."],
    };
  },
};

export const nestJsBackendAdapter: TechnologyAdapter = {
  id: "nestjs",
  contribute(manifest) {
    return {
      dependencies: {
        "@nestjs/common": "12.1.1",
        "@nestjs/core": "12.1.1",
        "@nestjs/platform-express": "12.1.1",
        "class-transformer": "0.5.1",
        "class-validator": "0.14.2",
        "reflect-metadata": "0.2.2",
        rxjs: "7.8.2",
      },
      devDependencies: { "@nestjs/cli": "12.0.0", "@nestjs/testing": "12.1.1", tsx: "4.20.6" },
      env: { PORT: "3001", NEXT_PUBLIC_API_URL: "http://localhost:3001" },
      files: {
        "apps/web/package.json": JSON.stringify({ name: `@${manifest.project.name}/web`, private: true, scripts: { dev: "next dev", build: "next build", start: "next start", test: "vitest run" } }, null, 2) + "\n",
        "apps/api/package.json": JSON.stringify({ name: `@${manifest.project.name}/api`, private: true, scripts: { dev: "tsx watch src/main.ts", build: "tsc -p tsconfig.json", start: "node dist/main.js", test: "vitest run" } }, null, 2) + "\n",
        "apps/api/tsconfig.json": JSON.stringify({ compilerOptions: { target: "ES2022", module: "NodeNext", moduleResolution: "NodeNext", strict: true, outDir: "dist", rootDir: "src", experimentalDecorators: true, emitDecoratorMetadata: true, esModuleInterop: true, skipLibCheck: true }, include: ["src/**/*.ts"], exclude: ["src/**/*.test.ts"] }, null, 2) + "\n",
        "apps/api/src/main.ts": `import "reflect-metadata";\nimport { ValidationPipe } from "@nestjs/common";\nimport { NestFactory } from "@nestjs/core";\nimport { AppModule } from "./app.module.js";\nasync function bootstrap() { const app = await NestFactory.create(AppModule); app.enableCors({ origin: process.env.WEB_URL ?? "http://localhost:3000", credentials: true }); app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true })); await app.listen(process.env.PORT ?? 3001); }\nbootstrap().catch((error) => { console.error(error); process.exit(1); });\n`,
        "apps/api/src/app.module.ts": `import { Module } from "@nestjs/common";\nimport { HealthController } from "./health.controller.js";\nimport { ProfileController } from "./auth/profile.controller.js";\n@Module({ controllers: [HealthController, ProfileController] }) export class AppModule {}\n`,
        "apps/api/src/health.controller.ts": `import { Controller, Get } from "@nestjs/common";\n@Controller("health") export class HealthController { @Get() read() { return { status: "ok" }; } }\n`,
        "apps/api/src/health.controller.test.ts": `import { describe, expect, it } from "vitest";\nimport { HealthController } from "./health.controller.js";\ndescribe("HealthController", () => { it("reports ok", () => expect(new HealthController().read()).toEqual({ status: "ok" })); });\n`,
        "packages/database/package.json": JSON.stringify({ name: `@${manifest.project.name}/database`, private: true, main: "src/index.ts" }, null, 2) + "\n",
        ...(manifest.deploy === "docker" ? { "apps/api/Dockerfile": apiDockerfile } : {}),
      },
      readme: ["## Architecture", "The `apps/web` Next.js frontend and `apps/api` NestJS API are independent workspaces. Authorization is enforced in the API."],
    };
  },
};

const apiDockerfile = `FROM node:22-alpine AS build\nWORKDIR /app\nCOPY . .\nRUN npm ci && npm run build -w apps/api\nFROM node:22-alpine\nWORKDIR /app\nCOPY --from=build /app/node_modules ./node_modules\nCOPY --from=build /app/apps/api/dist ./dist\nEXPOSE 3001\nCMD ["node", "dist/main.js"]\n`;
