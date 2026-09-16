import type { Metadata } from "next";
import Link from "next/link";

import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Example Cases — Mr. Reconcile",
  description: "Four payment reconciliation cases to try with Mr. Reconcile.",
};

const CASES = [
  {
    title: "Fee discrepancy",
    prompt: "Why did pay_2002 settle for less than expected?",
    description:
      "A completed payment where network fees explain the difference between the expected payment and merchant settlement.",
  },
  {
    title: "BTC payment",
    prompt:
      "Why doesn't the BTC payment for pay_2004 match the expected amount?",
    description:
      "A Bitcoin payment showing why the expected merchant amount can differ from the blockchain transaction value and how quote protection affects reconciliation.",
  },
  {
    title: "Missing funds",
    prompt: "Where are my funds for pay_2007?",
    description:
      "The primary demo: payment completed, Bitcoin confirmed, settlement pending, and no authoritative final netUsd yet.",
  },
  {
    title: "Pending confirmations",
    prompt: "Why is pay_2010 still pending?",
    description:
      "A Bitcoin transaction that has not yet reached its required confirmation threshold.",
  },
];

export default function ExamplesPage() {
  return (
    <div className="page">
      <Header initials="SE" activePath="/examples" />
      <main className="info-page" id="main-content">
        <header className="info-page__intro">
          <div className="eyebrow">Example cases</div>
          <h1 className="info-page__title">Four trails worth following.</h1>
          <p className="info-page__lede">
            Copy a prompt, return to the investigation desk, and see how Mr.
            Reconcile traces the payment from provider record to settlement.
          </p>
        </header>

        <section className="case-list" aria-label="Reconciliation examples">
          {CASES.map((item) => (
            <article className="case-row" key={item.title}>
              <div>
                <h2 className="case-row__title">{item.title}</h2>
                <p className="case-row__description">{item.description}</p>
              </div>
              <code className="case-row__prompt">{item.prompt}</code>
            </article>
          ))}
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
