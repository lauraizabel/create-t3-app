import type { ProjectManifest } from "@/core/project-manifest";
import type { TechnologyAdapter } from "../../types";

export const nextJsFrontendAdapter: TechnologyAdapter = {
  id: "nextjs",
  contribute(manifest: ProjectManifest) {
    const prefix = manifest.backend === "nestjs" ? "apps/web/" : "";
    return {
      dependencies: { next: "16.3.7", react: "19.2.4", "react-dom": "19.2.4", zod: "4.1.12" },
      devDependencies: {
        "@types/node": "22.19.1",
        "@types/react": "19.2.2",
        "@types/react-dom": "19.2.2",
        "@tailwindcss/postcss": "4.1.14",
        tailwindcss: "4.1.14",
        typescript: "5.9.3",
        eslint: "9.39.1",
        "eslint-config-next": "16.3.7",
        prettier: "3.6.2",
        vitest: "5.0.2",
      },
      files: {
        [`${prefix}src/app/layout.tsx`]: `import "./globals.css";\nexport const metadata = { title: "${manifest.project.name}", description: ${JSON.stringify(manifest.project.description)} };\nexport default function Layout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }\n`,
        [`${prefix}src/app/page.tsx`]: `import Link from "next/link";\nexport default function Home() { return <main className="shell"><span className="eyebrow">Generated with SaaSForge</span><h1>${manifest.project.name}</h1><p>${manifest.project.description}</p><div className="actions"><Link className="button" href="/sign-in">Get started</Link><Link href="/dashboard">Dashboard</Link></div></main>; }\n`,
        [`${prefix}src/app/dashboard/page.tsx`]: `export default function Dashboard() { return <main className="shell"><span className="eyebrow">Workspace</span><h1>Dashboard</h1><p>Your selected modules are wired and ready to customize.</p></main>; }\n`,
        [`${prefix}src/app/globals.css`]: `@import "tailwindcss";\n:root { color-scheme: dark; --bg: #090b10; --panel: #11151d; --text: #f4f7fb; --muted: #9aa7b8; --accent: #89f7c4; }\n* { box-sizing: border-box; } body { margin: 0; background: radial-gradient(circle at 15% 0%, #17382e, transparent 30%), var(--bg); color: var(--text); font: 16px/1.6 Arial, sans-serif; } a { color: inherit; } .shell { max-width: 780px; margin: 0 auto; min-height: 100vh; padding: 18vh 24px 60px; } h1 { font-size: clamp(3rem, 10vw, 6rem); line-height: .95; letter-spacing: -.06em; margin: 16px 0 24px; } p { color: var(--muted); max-width: 580px; } .eyebrow { color: var(--accent); text-transform: uppercase; letter-spacing: .16em; font-size: 12px; } .actions { display:flex; gap:24px; align-items:center; margin-top:36px; } button,.button { background: var(--accent); color:#07120e; border:0; border-radius:10px; padding:12px 18px; font-weight:700; text-decoration:none; cursor:pointer; } input { display:block; width:100%; max-width:420px; margin:16px 0; padding:12px; border:1px solid #2c3543; border-radius:10px; background:var(--panel); color:var(--text); }\n`,
        [`${prefix}src/env.ts`]: `import { z } from "zod";\nexport const env = z.object({ DATABASE_URL: z.string().url() }).parse(process.env);\n`,
        [`${prefix}next.config.ts`]: 'import type { NextConfig } from "next";\nconst config: NextConfig = { output: "standalone" };\nexport default config;\n',
        [`${prefix}postcss.config.mjs`]: 'const config = { plugins: { "@tailwindcss/postcss": {} } };\nexport default config;\n',
        [`${prefix}tsconfig.json`]: JSON.stringify(tsConfig, null, 2) + "\n",
        [`${prefix}next-env.d.ts`]: '/// <reference types="next" />\n/// <reference types="next/image-types/global" />\n',
        [`${prefix}src/app/health/route.ts`]: 'export function GET() { return Response.json({ status: "ok" }); }\n',
        [`${prefix}src/app/health/route.test.ts`]: 'import { describe, expect, it } from "vitest";\nimport { GET } from "./route";\ndescribe("health", () => { it("returns ok", async () => expect(await GET().json()).toEqual({ status: "ok" })); });\n',
        ...(manifest.ui === "shadcn" ? shadcnFiles(prefix) : {}),
        ...(manifest.deploy === "docker" ? { [`${prefix}Dockerfile`]: nextDockerfile } : {}),
      },
    };
  },
};

const tsConfig = { compilerOptions: { target: "ES2022", lib: ["dom", "dom.iterable", "esnext"], strict: true, noEmit: true, module: "esnext", moduleResolution: "bundler", resolveJsonModule: true, jsx: "react-jsx", esModuleInterop: true, skipLibCheck: true, paths: { "@/*": ["./src/*"] } }, include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"], exclude: ["node_modules"] };
const nextDockerfile = `FROM node:22-alpine AS build\nWORKDIR /app\nCOPY . .\nRUN npm ci && npm run build\nFROM node:22-alpine\nWORKDIR /app\nENV NODE_ENV=production\nCOPY --from=build /app/.next/standalone ./\nCOPY --from=build /app/.next/static ./.next/static\nEXPOSE 3000\nCMD ["node", "server.js"]\n`;
function shadcnFiles(prefix: string) { return {
  [`${prefix}components.json`]: '{"style":"new-york","rsc":true,"tsx":true,"tailwind":{"css":"src/app/globals.css"},"aliases":{"components":"@/components","utils":"@/lib/utils"}}\n',
  [`${prefix}src/lib/utils.ts`]: 'export function cn(...classes: Array<string | false | null | undefined>) { return classes.filter(Boolean).join(" "); }\n',
  [`${prefix}src/components/ui/button.tsx`]: 'import type { ButtonHTMLAttributes } from "react";\nimport { cn } from "@/lib/utils";\nexport function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) { return <button className={cn("rounded-md px-4 py-2 font-medium", className)} {...props} />; }\n',
}; }
