import type { ProjectManifest } from "@/core/project-manifest";

export type FileMap = Map<string, string>;

export type ModuleContribution = {
  files?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  env?: Record<string, string>;
  prismaModels?: string[];
  readme?: string[];
};

export interface TechnologyAdapter {
  readonly id: string;
  contribute(manifest: ProjectManifest): ModuleContribution;
}

export interface FeatureModule {
  readonly id: string;
  contribute(manifest: ProjectManifest): ModuleContribution;
}

export type GenerationResult = {
  files: FileMap;
  manifest: ProjectManifest;
  moduleIds: string[];
};
