import type { ProjectManifest } from "@/core/project-manifest";
import type { TechnologyAdapter } from "../../types";

export const authJsAdapter: TechnologyAdapter = {
  id: "authjs",
  contribute(manifest: ProjectManifest) {
    const prefix = manifest.backend === "nestjs" ? "apps/web/" : "";
    return {
      dependencies: {
        "@auth/prisma-adapter": "2.11.3",
        "next-auth": "5.0.0-beta.32",
      },
      env: {
        AUTH_SECRET: "replace-with-a-long-random-secret",
        AUTH_GITHUB_ID: "github-oauth-app-id",
        AUTH_GITHUB_SECRET: "github-oauth-app-secret",
      },
      prismaModels: [accountModel, sessionModel, verificationTokenModel],
      files: {
        [`${prefix}src/auth.ts`]: `import NextAuth from "next-auth";\nimport GitHub from "next-auth/providers/github";\nimport { PrismaAdapter } from "@auth/prisma-adapter";\nimport { db } from "@/lib/db";\n\nexport const { handlers, auth, signIn, signOut } = NextAuth({\n  adapter: PrismaAdapter(db),\n  providers: [GitHub],\n  pages: { signIn: "/sign-in" },\n});\n`,
        [`${prefix}src/app/api/auth/[...nextauth]/route.ts`]: 'import { handlers } from "@/auth";\nexport const { GET, POST } = handlers;\n',
        [`${prefix}src/app/sign-in/page.tsx`]: `import { signIn } from "@/auth";\n\nexport default function SignIn() {\n  return <main className="shell"><h1>Welcome back</h1><form action={async () => { "use server"; await signIn("github", { redirectTo: "/dashboard" }); }}><button>Continue with GitHub</button></form></main>;\n}\n`,
      },
      readme: ["## Authentication", "Create a GitHub OAuth app, configure the `AUTH_*` variables, then open `/sign-in`."],
    };
  },
};

const accountModel = `model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}`;

const sessionModel = `model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}`;

const verificationTokenModel = `model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}`;
