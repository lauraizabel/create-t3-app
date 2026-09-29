"use client";

import { useMemo, useState } from "react";
import { catalog, expectedStructure, featureCatalog } from "@/core/catalog";
import { DependencyResolver } from "@/core/dependency-resolver";
import { defaultManifest, featureIds, type FeatureId, type ProjectManifest } from "@/core/project-manifest";

const steps = ["Project", "Frontend", "Backend", "Database", "Authentication", "Billing", "Features", "Review"] as const;

export function ProjectWizard() {
  const [step, setStep] = useState(0);
  const [manifest, setManifest] = useState<ProjectManifest>(defaultManifest);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const resolution = useMemo(() => new DependencyResolver().resolve(manifest), [manifest]);
  const effective = resolution.manifest;

  function choose<K extends keyof ProjectManifest>(key: K, value: ProjectManifest[K]) {
    setManifest((current) => ({ ...current, [key]: value }));
  }

  function toggleFeature(id: FeatureId) {
    setManifest((current) => {
      const selected = current.features.includes(id) ? current.features.filter((feature) => feature !== id) : [...current.features, id];
      const candidate = { ...current, features: selected, ...(id === "subscriptions" && !current.features.includes(id) ? { billing: "stripe" as const } : {}) };
      return new DependencyResolver().resolve(candidate).manifest;
    });
  }

  async function generate() {
    setGenerating(true);
    setError("");
    try {
      const response = await fetch("/api/generate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(effective) });
      if (!response.ok) throw new Error((await response.json()).error ?? "Generation failed.");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${effective.project.name}.zip`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  const canContinue = step !== 0 || /^[a-z][a-z0-9-]{1,49}$/.test(manifest.project.name);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#">SaaS<span>Forge</span></a>
        <p className="sidebar-copy">Build the architecture your product needs. Keep everything else out.</p>
        <nav aria-label="Generator steps">
          {steps.map((label, index) => (
            <button key={label} className={`step ${index === step ? "active" : ""} ${index < step ? "done" : ""}`} onClick={() => index <= step && setStep(index)}>
              <span>{index < step ? "✓" : index + 1}</span>{label}
            </button>
          ))}
        </nav>
        <div className="sidebar-note"><i /> Manifest v1<br /><small>Your choices stay portable.</small></div>
      </aside>

      <section className="workspace">
        <header className="topbar"><span>New project</span><code>{manifest.project.name || "untitled"}</code></header>
        <div className="content">
          <div className="progress"><span style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div>
          <p className="kicker">Step {step + 1} of {steps.length}</p>
          {renderStep(step, manifest, choose, toggleFeature, effective, resolution.added)}
          {resolution.errors.map((message) => <p className="error" key={message}>{message}</p>)}
          {error && <p className="error">{error}</p>}
          <footer className="controls">
            <button className="button secondary" disabled={step === 0} onClick={() => setStep((value) => value - 1)}>Back</button>
            {step < steps.length - 1 ? (
              <button className="button primary" disabled={!canContinue} onClick={() => setStep((value) => value + 1)}>Continue <span>→</span></button>
            ) : (
              <button className="button primary generate" disabled={generating || resolution.errors.length > 0} onClick={generate}>{generating ? "Composing…" : "Generate project"} <span>↓</span></button>
            )}
          </footer>
        </div>
      </section>
    </main>
  );
}

function renderStep(
  step: number,
  manifest: ProjectManifest,
  choose: <K extends keyof ProjectManifest>(key: K, value: ProjectManifest[K]) => void,
  toggleFeature: (id: FeatureId) => void,
  effective: ProjectManifest,
  added: { id: FeatureId; reason: string }[],
) {
  if (step === 0) return <><h1>Name your <em>next thing.</em></h1><p className="lead">Start with a project identity. Every generated file will be derived from a versioned manifest.</p><div className="form"><label>Project name<input value={manifest.project.name} onChange={(event) => choose("project", { ...manifest.project, name: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} /></label><label>Description<textarea value={manifest.project.description} onChange={(event) => choose("project", { ...manifest.project, description: event.target.value })} /></label></div></>;
  if (step === 1) return <><h1>Choose the <em>experience.</em></h1><p className="lead">Pick the web framework, component approach, and deployment starting point.</p><OptionGrid options={catalog.frontend} selected={manifest.frontend} onSelect={(id) => choose("frontend", id as ProjectManifest["frontend"])} /><h2>UI system</h2><OptionGrid options={catalog.ui} selected={manifest.ui} onSelect={(id) => choose("ui", id as ProjectManifest["ui"])} /><h2>Deployment files</h2><OptionGrid options={catalog.deploy} selected={manifest.deploy} onSelect={(id) => choose("deploy", id as ProjectManifest["deploy"])} /></>;
  if (step === 2) return <><h1>Place the <em>server boundary.</em></h1><p className="lead">Keep UI and API together or split them into independently deployable applications.</p><OptionGrid options={catalog.backend} selected={manifest.backend} onSelect={(id) => choose("backend", id as ProjectManifest["backend"])} />{manifest.backend === "nestjs" && manifest.auth === "authjs" && <p className="notice">NestJS requires Supabase Auth in this MVP. Authentication will be selected on the next step.</p>}</>;
  if (step === 3) return <><h1>Model the <em>source of truth.</em></h1><p className="lead">The initial adapter ships migrations and a type-safe client.</p><OptionGrid options={catalog.database} selected={manifest.database} onSelect={(id) => choose("database", id as ProjectManifest["database"])} /><h2>ORM</h2><OptionGrid options={catalog.orm} selected={manifest.orm} onSelect={(id) => choose("orm", id as ProjectManifest["orm"])} /></>;
  if (step === 4) return <><h1>Know every <em>user.</em></h1><p className="lead">Authentication is configured for secure server-side sessions and protected application routes.</p><OptionGrid options={catalog.auth.map((option) => ({ ...option, available: option.available && !(manifest.backend === "nestjs" && option.id === "authjs") }))} selected={manifest.auth} onSelect={(id) => choose("auth", id as ProjectManifest["auth"])} />{manifest.backend === "nestjs" && manifest.auth === "authjs" && <button className="inline-action" onClick={() => choose("auth", "supabase")}>Use the compatible Supabase adapter →</button>}</>;
  if (step === 5) return <><h1>Decide how you <em>charge.</em></h1><p className="lead">Billing can stay out entirely or arrive with a verified webhook boundary.</p><OptionGrid options={catalog.billing} selected={manifest.billing} onSelect={(id) => choose("billing", id as ProjectManifest["billing"])} />{manifest.features.includes("subscriptions") && manifest.billing === "none" && <p className="notice">Subscriptions require Stripe.</p>}</>;
  if (step === 6) return <><h1>Add only what <em>earns its place.</em></h1><p className="lead">Dependencies are included automatically and remain visible in the generated manifest.</p><div className="feature-grid">{featureIds.map((id) => { const selected = manifest.features.includes(id); return <button key={id} className={`feature-card ${selected ? "selected" : ""}`} onClick={() => toggleFeature(id)}><span className="check">{selected ? "✓" : "+"}</span><strong>{featureCatalog[id].label}</strong><small>{featureCatalog[id].description}</small></button>; })}</div>{added.length > 0 && <div className="notice"><strong>Dependencies added</strong>{added.map((item) => <span key={item.id}>{featureCatalog[item.id].label}: {item.reason}</span>)}</div>}</>;
  const costs = [catalog.auth.find((item) => item.id === effective.auth)?.cost, catalog.billing.find((item) => item.id === effective.billing)?.cost].filter(Boolean);
  return <><h1>Ready to <em>compose.</em></h1><p className="lead">This is the exact architecture the generator will write to the ZIP.</p><div className="review-grid"><section><p className="kicker">Stack</p><ReviewRow label="Frontend" value="Next.js"/><ReviewRow label="Backend" value={effective.backend === "nestjs" ? "NestJS" : "Next.js API"}/><ReviewRow label="Data" value="PostgreSQL · Prisma"/><ReviewRow label="Auth" value={effective.auth === "authjs" ? "Auth.js" : "Supabase Auth"}/><ReviewRow label="UI" value={effective.ui === "shadcn" ? "shadcn/ui" : "Tailwind CSS"}/><ReviewRow label="Billing" value={effective.billing === "stripe" ? "Stripe" : "None"}/></section><section><p className="kicker">Expected structure</p><pre className="tree">{`${effective.project.name}/\n${expectedStructure(effective).map((path, i, all) => `${i === all.length - 1 ? "└" : "├"}── ${path}`).join("\n")}`}</pre></section></div><section className="review-block"><p className="kicker">Features</p><div className="chips">{effective.features.map((id) => <span key={id}>{featureCatalog[id].label}</span>)}</div></section><section className="review-block"><p className="kicker">External costs</p><p>{costs.length ? costs.join("; ") + ". Review provider pricing before launch." : "No paid external provider is required by this configuration."}</p></section></>;
}

function OptionGrid({ options, selected, onSelect }: { options: typeof catalog.frontend; selected: string; onSelect: (id: string) => void }) {
  return <div className="option-grid">{options.map((option) => <button key={option.id} disabled={!option.available} className={`option-card ${selected === option.id ? "selected" : ""}`} onClick={() => onSelect(option.id)}><span className="radio"/><strong>{option.label}</strong><small>{option.description}</small>{!option.available && <b>Coming soon</b>}</button>)}</div>;
}

function ReviewRow({ label, value }: { label: string; value: string }) { return <div className="review-row"><span>{label}</span><strong>{value}</strong></div>; }
