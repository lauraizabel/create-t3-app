import type { ProjectManifest } from "@/core/project-manifest";
import type { TechnologyAdapter } from "../../types";

export const supabaseAdapter: TechnologyAdapter = {
  id: "supabase",
  contribute(manifest: ProjectManifest) {
    const web = manifest.backend === "nestjs" ? "apps/web/" : "";
    const files: Record<string, string> = {
      [`${web}src/lib/supabase/client.ts`]: `"use client";\nimport { createBrowserClient } from "@supabase/ssr";\nexport function createClient() { return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!); }\n`,
      [`${web}src/lib/supabase/server.ts`]: `import { createServerClient } from "@supabase/ssr";\nimport { cookies } from "next/headers";\nexport async function createClient() {\n  const store = await cookies();\n  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, { cookies: { getAll: () => store.getAll(), setAll: (items) => { try { items.forEach(({ name, value, options }) => store.set(name, value, options)); } catch {} } } });\n}\n`,
      [`${web}src/app/sign-in/page.tsx`]: `"use client";\nimport { useState } from "react";\nimport { createClient } from "@/lib/supabase/client";\nexport default function SignIn() {\n  const [email, setEmail] = useState(""); const [message, setMessage] = useState("");\n  async function submit(event: React.FormEvent) { event.preventDefault(); const { error } = await createClient().auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + "/auth/callback" } }); setMessage(error?.message ?? "Check your email for the sign-in link."); }\n  return <main className="shell"><h1>Sign in</h1><form onSubmit={submit}><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required /><button>Send magic link</button></form><p>{message}</p></main>;\n}\n`,
      [`${web}src/app/auth/callback/route.ts`]: `import { NextResponse } from "next/server";\nimport { createClient } from "@/lib/supabase/server";\nexport async function GET(request: Request) { const url = new URL(request.url); const code = url.searchParams.get("code"); if (code) await (await createClient()).auth.exchangeCodeForSession(code); return NextResponse.redirect(new URL("/dashboard", url.origin)); }\n`,
    };

    if (manifest.backend === "nestjs") {
      files["apps/api/src/auth/supabase.guard.ts"] = `import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";\nimport { createRemoteJWKSet, jwtVerify } from "jose";\n@Injectable() export class SupabaseGuard implements CanActivate {\n  async canActivate(context: ExecutionContext) { const request = context.switchToHttp().getRequest(); const token = request.headers.authorization?.replace(/^Bearer /, ""); if (!token) throw new UnauthorizedException(); const url = process.env.SUPABASE_URL!; const jwks = createRemoteJWKSet(new URL(url + "/auth/v1/.well-known/jwks.json")); const { payload } = await jwtVerify(token, jwks, { issuer: url + "/auth/v1" }); request.user = payload; return true; }\n}\n`;
      files["apps/api/src/auth/profile.controller.ts"] = `import { Controller, Get, Req, UseGuards } from "@nestjs/common";\nimport { SupabaseGuard } from "./supabase.guard.js";\n@Controller("me") @UseGuards(SupabaseGuard) export class ProfileController { @Get() read(@Req() request: { user: unknown }) { return request.user; } }\n`;
    }
    return {
      dependencies: { "@supabase/ssr": "0.12.7", "@supabase/supabase-js": "2.117.2", ...(manifest.backend === "nestjs" ? { jose: "6.1.0" } : {}) },
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "https://your-project.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "your-publishable-key",
        ...(manifest.backend === "nestjs" ? { SUPABASE_URL: "https://your-project.supabase.co" } : {}),
      },
      files,
      readme: ["## Authentication", "Create a Supabase project, set the public URL and publishable key, and add `/auth/callback` to the allowed redirect URLs."],
    };
  },
};
