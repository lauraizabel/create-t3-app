# Generator architecture

`ProjectManifest` is the only input to generation. The API validates it, resolves feature dependencies, selects registered adapters, composes their contributions, and writes a ZIP. The same resolver is used by the wizard for immediate feedback and by the server as the authoritative check.

Adapters contribute virtual files, package versions, environment variables, Prisma models, and README sections. The composer rejects duplicate file ownership and conflicting package versions. This makes a module failure visible instead of silently overwriting another module.

## Extension path

1. Add a `TechnologyAdapter` or `FeatureModule` under `src/generator/templates`.
2. Register it in `ModuleRegistry`.
3. Expose it as available in the catalog when its generated output passes validation.

The generation pipeline does not change when a technology is added. Future GitHub, provisioning, CI/CD, and deployment integrations should consume the resolved manifest and generated archive through a separate `ProjectPublisher` boundary; they do not belong in template composition.

## Generation phases

1. Validate the manifest schema.
2. Resolve transitive feature dependencies.
3. Evaluate compatibility rules.
4. Select adapters from the registry.
5. Merge file and metadata contributions.
6. Render derived files such as Prisma schema, README, package metadata, and environment examples.
7. Package the in-memory file map as a ZIP.
