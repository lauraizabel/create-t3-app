import type { FeatureId, ProjectManifest } from "./project-manifest";

export type Resolution = {
  manifest: ProjectManifest;
  added: { id: FeatureId; reason: string }[];
  errors: string[];
};

const dependencies: Partial<Record<FeatureId, { id: FeatureId; reason: string }[]>> = {
  organizations: [{ id: "authentication", reason: "Organizations need authenticated members." }],
  rbac: [
    { id: "authentication", reason: "Roles must be assigned to authenticated users." },
    { id: "organizations", reason: "MVP roles are scoped to an organization." },
  ],
  trial: [{ id: "subscriptions", reason: "Trials transition into subscriptions." }],
  subscriptions: [
    { id: "authentication", reason: "Subscriptions need a customer identity." },
    { id: "organizations", reason: "MVP subscriptions are owned by an organization." },
  ],
  "feature-flags": [{ id: "organizations", reason: "MVP flags are scoped to organizations." }],
};

export class DependencyResolver {
  resolve(input: ProjectManifest): Resolution {
    const selected = new Set<FeatureId>(input.features);
    const added: Resolution["added"] = [];
    let changed = true;

    while (changed) {
      changed = false;
      for (const feature of [...selected]) {
        for (const dependency of dependencies[feature] ?? []) {
          if (!selected.has(dependency.id)) {
            selected.add(dependency.id);
            added.push(dependency);
            changed = true;
          }
        }
      }
    }

    const manifest = { ...input, features: [...selected] };
    const errors: string[] = [];
    if (selected.has("subscriptions") && manifest.billing !== "stripe") {
      errors.push("Subscriptions require Stripe as the billing provider.");
    }
    if (manifest.ui === "shadcn" && manifest.frontend !== "nextjs") {
      errors.push("shadcn/ui requires a React-based frontend.");
    }
    if (manifest.backend === "nestjs" && manifest.auth === "authjs") {
      errors.push("The NestJS adapter currently supports Supabase Auth. Choose Supabase or Next.js API.");
    }

    return { manifest, added, errors };
  }
}
