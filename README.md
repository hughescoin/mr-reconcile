# Mr. Reconcile

Mr. Reconcile is an AI-assisted payment reconciliation agent built for the Vercel Solutions Architect take-home assessment.

It demonstrates how Vercel can augment an existing payment platform with a natural-language investigation experience while preserving the underlying payment infrastructure as the system of record.

## Live Demo

https://mr-reconcile.vercel.app

## Customer Proposal

https://reconcile-1.vercel.app

## Problem Statement

Can we move common payment-reconciliation investigations from synchronous Solutions Engineering escalations toward AI-assisted self-service while preserving the existing payment system as the source of truth?

## Scenario

This project models two fictional businesses.

### AcmeCommerce

AcmeCommerce provides a crypto payment product that merchants integrate into their applications.

Its Support and Solutions Engineering teams help merchants troubleshoot integrations and investigate payment discrepancies.

### ShopCo

ShopCo sells GPUs, local inference hardware, and prebuilt Linux-based AI systems.

ShopCo uses AcmeCommerce for payments and occasionally needs help reconciling expected payments against blockchain activity and settlement records.

## The Problem

Most payments reconcile normally. Occasionally, ShopCo sees a missing, delayed, or mismatched payment.

For example:

> “Our order says the customer paid $1,200, but our records show something different. What happened?”

Answering that question may require correlating:

- payment status
- blockchain transaction state
- confirmations
- quote and execution pricing
- network or platform fees
- settlement status
- final merchant payout

A seemingly simple question can create a manual workflow:

```text
ShopCo identifies a discrepancy
        ↓
Contacts AcmeCommerce
        ↓
Support / Solutions Engineering investigates
        ↓
Payment, transaction, and settlement records are correlated
        ↓
Back-and-forth with the merchant
        ↓
Reconciliation is explained
```

In the representative scenario, these investigations can consume **3–12 hours per week in aggregate across Support and Solutions Engineering**.

**Technical friction:** Financial state must be correlated across multiple systems before a discrepancy can be explained.

**Business friction:** Routine reconciliation questions consume specialist time and increase merchant time-to-resolution.

## Proposed Solution

Mr. Reconcile **augments rather than replaces** AcmeCommerce's existing payment infrastructure.

A ShopCo merchant can ask a natural-language question such as:

> “Where are my funds for pay_2007?”

The agent can use narrowly scoped tools to retrieve authoritative:

- payment details
- blockchain transaction details
- settlement details

It then explains the investigation in plain language.

The existing payment system remains responsible for establishing financial truth.

> **The LLM explains the truth; it does not define the truth.**

Operational payment, blockchain, and settlement states shown in the interface are derived from structured tool results rather than generated model prose.

## Architecture

```text
Browser / User
      ↓
Next.js + useEveAgent()
      ↓
/eve/v1/session
      ↓
withEve() mounted Eve runtime
      ↓
Eve durable session
      ↕
AI Gateway
      ↓
Reconciliation Tools
Payment · Transaction · Settlement
      ↓
AcmeCommerce API Client
      ↓
Public HTTPS
      ↓
AWS API Gateway
      ↓
AWS Lambda
      ↓
Authoritative Synthetic Data
Payments · Transactions · Settlements
      ↓
Eve action.result events
      ↓
Deterministic InvestigationStep[] mapper
      ↓
Financial status and amount UI
```

### What Stays Outside Vercel

AcmeCommerce's existing payment infrastructure remains on AWS.

For the proof of concept, that environment is represented by:

- AWS API Gateway
- AWS Lambda
- synthetic payment, transaction, and settlement records

The goal is not to migrate the payment platform. The goal is to add a better investigation experience around systems that already own the authoritative financial state.

## Vercel Products

### Eve

Used for:

- directory-based agent and tool definitions
- durable sessions and multi-step tool execution
- same-origin Next.js routes through `withEve()`
- streamed React state through `useEveAgent()`
- authoritative structured tool-result events
- repeatable Eve-native evals

### AI Gateway

Provides the model-access boundary between the application and the underlying model.

This keeps model integration separate from application logic and creates a path toward centralized AI usage visibility and future model flexibility.

Provider failover is not demonstrated in the current proof of concept.

### Vercel Functions

`withEve()` packages the Next.js application and Eve runtime as one Vercel project, routing `/eve/v1/**` requests to the generated Eve service.

This execution layer handles:

- agent execution
- model interaction
- tool calls
- outbound requests to AcmeCommerce
- streamed responses back to the client

The Vercel Function is deployed in `iad1` / US East, geographically aligned with the representative AWS Lambda deployment in US East.

### Framework

The application is built with Next.js and TypeScript.

Next.js is the application framework and is not counted as one of the three primary Vercel product choices.

## Customer Experience

Today:

```text
Payment discrepancy
      ↓
Support escalation
      ↓
Solutions Engineer investigation
      ↓
Merchant explanation
```

With Mr. Reconcile:

```text
Payment discrepancy
      ↓
Ask a natural-language question
      ↓
Agent investigates authoritative systems
      ↓
Plain-language explanation
      ↓
Escalate only when necessary
```

The goal is not to introduce a new reconciliation language or operational toolset. Merchants ask the question the way they already would.

## Outcomes to Validate

The proposed pilot would evaluate:

- **Reconciliation deflection** — reduce supported cases requiring Support or Solutions Engineering intervention.
- **Time to resolution** — resolve common supported investigations in under 30 seconds.
- **Financial correctness** — zero fabricated payouts across the evaluation set.
- **Investigation reliability** — measure correct tool execution and explanation across supported reconciliation scenarios.

These are proposed pilot measures, not claimed production results.

## Known Limitations

This is a focused proof of concept.

- **Synthetic data:** No real merchant financial information is used.
- **Authentication and authorization:** The public demo intentionally does not implement merchant identity or tenant authorization.
- **Network boundary:** The current Vercel-to-AWS integration uses public HTTPS.
- **Agent nondeterminism:** Model-driven tool selection can produce different investigation paths across runs. Higher-risk mandatory financial checks may warrant deterministic application logic.
- **Durability and history:** Eve durably executes each live session, but this checkpoint does not yet persist the browser session cursor or event log across page reloads and does not provide a long-term audit store.

## Validation

The project was validated with:

- Lambda tests
- AcmeCommerce API integration tests
- reconciliation tool integration tests
- agent tests and evaluation cases
- deterministic Eve tool and event-mapper parity tests
- Eve-native end-to-end eval definitions
- ESLint
- TypeScript
- production builds
- production end-to-end smoke tests

The evaluation suite covers scenarios including:

- fee discrepancies
- BTC quote protection
- pending settlement without an authoritative payout
- insufficient blockchain confirmations

## Data

All merchant, payment, transaction, pricing, and settlement information in this project is synthetic.

The scenario is informed by real-world payment-reconciliation workflows but does not reproduce confidential customer or company data.
