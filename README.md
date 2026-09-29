# SaaSForge

A manifest-driven project generator for composing SaaS foundations without maintaining a separate boilerplate for every stack combination.

The MVP supports Next.js, Next.js API or NestJS, PostgreSQL, Prisma, Auth.js or Supabase Auth, Stripe, Tailwind CSS, shadcn/ui, Docker, and six composable SaaS features. Planned technologies remain visible in the wizard but cannot be selected until their adapters are implemented.

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>, complete the wizard, and download the generated ZIP.

## Checks

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

See [docs/architecture.md](docs/architecture.md) for the manifest, module composition, conflict handling, and extension path.
