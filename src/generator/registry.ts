import type { FeatureId } from "@/core/project-manifest";
import { authJsAdapter } from "./templates/auth/authjs";
import { supabaseAdapter } from "./templates/auth/supabase";
import { nextJsBackendAdapter, nestJsBackendAdapter } from "./templates/backend/adapters";
import { noBillingAdapter, stripeAdapter } from "./templates/billing/stripe";
import { prismaAdapter } from "./templates/database/prisma";
import { featureModules } from "./templates/features";
import { nextJsFrontendAdapter } from "./templates/frontend/nextjs";
import type { FeatureModule, TechnologyAdapter } from "./types";

export class ModuleRegistry {
  readonly frontend: Record<string, TechnologyAdapter> = { nextjs: nextJsFrontendAdapter };
  readonly backend: Record<string, TechnologyAdapter> = { nextjs: nextJsBackendAdapter, nestjs: nestJsBackendAdapter };
  readonly database: Record<string, TechnologyAdapter> = { prisma: prismaAdapter };
  readonly auth: Record<string, TechnologyAdapter> = { authjs: authJsAdapter, supabase: supabaseAdapter };
  readonly billing: Record<string, TechnologyAdapter> = { stripe: stripeAdapter, none: noBillingAdapter };
  readonly features: Record<FeatureId, FeatureModule> = featureModules;

  get(group: "frontend" | "backend" | "database" | "auth" | "billing", id: string) {
    const adapter = this[group][id];
    if (!adapter) throw new Error(`No ${group} adapter registered for ${id}.`);
    return adapter;
  }
}
