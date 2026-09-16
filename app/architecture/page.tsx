import type { Metadata } from "next";
import Link from "next/link";

import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Architecture — Mr. Reconcile",
  description: "How Mr. Reconcile connects Vercel to AcmeCommerce systems.",
};

const POC_DIAGRAM = `┌─────────────────────────┐
│      Browser / User     │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│ Next.js + useEveAgent() │
│       withEve()         │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│  /eve/v1/session routes │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   Eve durable session   │
│       AI Gateway        │
└────────────┬────────────┘
             │
             ▼
┌───────────────────────────────────────┐
│          Reconciliation Tools         │
│                                       │
│  Payment   Transaction   Settlement   │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌─────────────────────────┐
│ AcmeCommerce API Client │
└────────────┬────────────┘
             │ HTTPS
             ▼
┌─────────────────────────┐
│    AWS API Gateway      │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│      AWS Lambda         │
└────────────┬────────────┘
             │
             ▼
┌───────────────────────────────────────┐
│  Synthetic AcmeCommerce Provider Data │
│  Payments · Transactions · Settlements│
└───────────────────┬───────────────────┘
                    │ action.result
                    ▼
┌───────────────────────────────────────┐
│ Deterministic InvestigationStep[] UI  │
│   Statuses and amounts from tools     │
└───────────────────────────────────────┘`;

export default function ArchitecturePage() {
  return (
    <div className="page">
      <Header initials="SE" activePath="/architecture" />
      <main className="info-page" id="main-content">
        <header className="info-page__intro">
          <div className="eyebrow">Mr. Reconcile</div>
          <h1 className="info-page__title">System architecture.</h1>
          <p className="info-page__lede">
            How a reconciliation request moves from the browser to authoritative
            AcmeCommerce payment, transaction, and settlement records.
          </p>
        </header>

        <section
          className="diagram-section"
          aria-labelledby="architecture-heading"
        >
          <h2 className="diagram-section__title" id="architecture-heading">
            Request path
          </h2>
          <pre className="architecture-diagram">
            <code>{POC_DIAGRAM}</code>
          </pre>
        </section>

        <Link className="editorial-link" href="/">
          Return to the investigation desk →
        </Link>
      </main>

      <footer className="site-footer">
        <div className="site-footer__org">
          AcmeCommerce · Financial Operations
        </div>
        <div className="site-footer__quip">
          Every satoshi accounted for.
        </div>
      </footer>
    </div>
  );
}
