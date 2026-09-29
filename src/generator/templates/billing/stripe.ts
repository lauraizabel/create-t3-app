import type { TechnologyAdapter } from "../../types";

export const stripeAdapter: TechnologyAdapter = {
  id: "stripe",
  contribute(manifest) {
    const prefix = manifest.backend === "nestjs" ? "apps/api/" : "";
    const route = manifest.backend === "nestjs" ? "src/billing/stripe.ts" : "src/app/api/stripe/webhook/route.ts";
    const code = manifest.backend === "nestjs"
      ? `import Stripe from "stripe";\nexport const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);\nexport function verifyStripeEvent(body: string | Buffer, signature: string) { return stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!); }\n`
      : `import Stripe from "stripe";\nconst stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);\nexport async function POST(request: Request) { try { const body = await request.text(); const signature = request.headers.get("stripe-signature"); if (!signature) return new Response("Missing signature", { status: 400 }); const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!); /* Update subscription state idempotently using event.id. */ return Response.json({ received: true, type: event.type }); } catch { return new Response("Invalid webhook", { status: 400 }); } }\n`;
    return {
      dependencies: { stripe: "22.6.2" },
      env: { STRIPE_SECRET_KEY: "sk_test_replace_me", STRIPE_WEBHOOK_SECRET: "whsec_replace_me", STRIPE_PRICE_ID: "price_replace_me" },
      files: { [`${prefix}${route}`]: code },
      readme: ["## Billing", "Create a Stripe product and price, set the three `STRIPE_*` variables, and forward signed webhook events to the generated webhook handler."],
    };
  },
};

export const noBillingAdapter: TechnologyAdapter = { id: "none", contribute: () => ({}) };
