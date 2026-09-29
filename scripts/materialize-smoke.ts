import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defaultManifest } from "../src/core/project-manifest";
import { ProjectGenerator } from "../src/generator/project-generator";

async function main() {
  const target = resolve(".smoke-generated");
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });

  const samples = [
  {
    ...defaultManifest,
    project: { name: "next-sample", description: "Integrated smoke test" },
    billing: "stripe" as const,
    ui: "shadcn" as const,
    deploy: "docker" as const,
    features: ["authentication", "organizations", "rbac", "trial", "subscriptions", "feature-flags"] as const,
  },
  {
    ...defaultManifest,
    project: { name: "nest-sample", description: "Monorepo smoke test" },
    backend: "nestjs" as const,
    auth: "supabase" as const,
  },
  ];

  for (const sample of samples) {
    const result = new ProjectGenerator().generate(sample);
    for (const [path, content] of result.files) {
      const output = resolve(target, sample.project.name, path);
      await mkdir(resolve(output, ".."), { recursive: true });
      await writeFile(output, content);
    }
  }

  console.log(`Materialized ${samples.length} generated projects in ${target}`);
}

main().catch((error) => { console.error(error); process.exit(1); });
