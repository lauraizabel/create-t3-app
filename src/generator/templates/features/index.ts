import type { FeatureId, ProjectManifest } from "@/core/project-manifest";
import type { FeatureModule, ModuleContribution } from "../../types";

const feature = (id: FeatureId, build: (manifest: ProjectManifest) => ModuleContribution): FeatureModule => ({ id, contribute: build });

export const featureModules: Record<FeatureId, FeatureModule> = {
  authentication: feature("authentication", () => ({
    readme: ["### Authentication", "Authentication routes and provider configuration are included."],
  })),
  organizations: feature("organizations", (manifest) => ({
    prismaModels: [`model Organization {
  id          String       @id @default(cuid())
  name        String
  slug        String       @unique
  memberships Membership[]
${manifest.features.includes("subscriptions") ? "  subscriptions Subscription[]" : ""}
${manifest.features.includes("feature-flags") ? "  featureFlags FeatureFlag[]" : ""}
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model Membership {
  id             String       @id @default(cuid())
  role           ${manifest.features.includes("rbac") ? "MemberRole   @default(MEMBER)" : "String       @default(\"member\")"}
  userId         String
  organizationId String
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  @@unique([userId, organizationId])
}`],
    readme: ["### Organizations", "Organizations own subscriptions and feature flags; memberships connect users to workspaces."],
  })),
  rbac: feature("rbac", (manifest) => ({
    prismaModels: ["enum MemberRole {\n  OWNER\n  ADMIN\n  MEMBER\n}"],
    files: { [manifest.backend === "nestjs" ? "apps/api/src/generated/rbac.ts" : "src/generated/rbac.ts"]: `export const permissions = { OWNER: ["manage:organization", "manage:billing", "manage:members"], ADMIN: ["manage:members"], MEMBER: ["read:organization"] } as const;\nexport function can(role: keyof typeof permissions, permission: string) { return (permissions[role] as readonly string[]).includes(permission); }\n` },
    readme: ["### RBAC", "Authorization roles are scoped through organization memberships."],
  })),
  subscriptions: feature("subscriptions", () => ({
    prismaModels: [`model Subscription {
  id                 String             @id @default(cuid())
  organizationId     String
  stripeCustomerId   String?            @unique
  stripeSubscriptionId String?          @unique
  status             SubscriptionStatus @default(INACTIVE)
  currentPeriodEnd   DateTime?
  trialEndsAt        DateTime?
  organization       Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
}

enum SubscriptionStatus {
  INACTIVE
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
}`],
    readme: ["### Subscriptions", "Subscription state is synchronized by signed Stripe webhook events."],
  })),
  trial: feature("trial", (manifest) => ({
    files: { [manifest.backend === "nestjs" ? "apps/api/src/generated/trial.ts" : "src/generated/trial.ts"]: `export function isTrialActive(trialEndsAt: Date | null) { return Boolean(trialEndsAt && trialEndsAt.getTime() > Date.now()); }\n` },
    readme: ["### Free trial", "Use `trialEndsAt` on the subscription to gate access; the generator does not depend on a scheduled downgrade job."],
  })),
  "feature-flags": feature("feature-flags", () => ({
    prismaModels: [`model FeatureFlag {
  id             String       @id @default(cuid())
  key            String
  enabled        Boolean      @default(false)
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  @@unique([organizationId, key])
}`],
    readme: ["### Feature flags", "Flags are stored per organization and default to disabled."],
  })),
};
