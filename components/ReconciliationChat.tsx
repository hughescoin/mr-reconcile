"use client";

import { useEveAgent } from "eve/react";
import { useState } from "react";
import { AnswerSection } from "@/components/AnswerSection";
import { AskPanel } from "@/components/AskPanel";
import { ExamplePromptChips } from "@/components/ExamplePromptChips";
import { InvestigationTrace } from "@/components/InvestigationTrace";
import { StatusBadge } from "@/components/StatusBadge";
import { mapEveInvestigationSteps } from "@/lib/map-eve-investigation-steps";

const EXAMPLE_PROMPTS = [
  {
    label: "Fee discrepancy",
    question: "Why did pay_2002 settle for less than expected?",
  },
  {
    label: "BTC payment",
    question:
      "Why doesn't the BTC payment for pay_2004 match the expected amount?",
  },
  {
    label: "Missing funds",
    question: "Where are my funds for pay_2007?",
  },
  {
    label: "Pending confirmations",
    question: "Why is pay_2010 still pending?",
  },
];

export function ReconciliationChat() {
  const [input, setInput] = useState("");
  const agent = useEveAgent();
  const { messages } = agent.data;

  async function handleSubmit() {
    const question = input.trim();

    if (!question) {
      return;
    }

    setInput("");

    await agent.send(question);
  }

  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");
  const latestAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const question =
    latestUserMessage?.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("") ?? "";
  const answer =
    latestAssistantMessage?.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("") ?? "";
  const isInvestigating =
    agent.status === "submitted" || agent.status === "streaming";
  const investigationSteps =
    agent.status === "submitted"
      ? []
      : mapEveInvestigationSteps(agent.events);

  const settlementStep = investigationSteps.find(
    (step) => step.type === "settlement",
  );

  return (
    <>
      <AskPanel
        value={input}
        onValueChange={setInput}
        onSubmit={handleSubmit}
        disabled={isInvestigating}
      >
        <div className="example-prompts">
          <div className="example-prompts__title">
            Click a chip to get started
          </div>
          <p className="example-prompts__helper">
            Choose a common reconciliation scenario to populate the question.
          </p>

          <ExamplePromptChips
            prompts={EXAMPLE_PROMPTS.map((item) => item.label)}
            onSelect={(label) => {
              const example = EXAMPLE_PROMPTS.find(
                (item) => item.label === label,
              );

              if (example) {
                setInput(example.question);
              }
            }}
          />
        </div>
      </AskPanel>

      {question && (answer || isInvestigating) && (
        <AnswerSection
          question={question}
          badge={
            settlementStep ? (
              <StatusBadge
                label={
                  settlementStep.status === "pending"
                    ? "Settlement pending"
                    : "Settlement Complete"
                }
                tone={
                  settlementStep.status === "pending" ? "pending" : "success"
                }
                pill
              />
            ) : undefined
          }
        >
          {answer ? (
            <p style={{ margin: 0 }}>{answer}</p>
          ) : (
            <p style={{ margin: 0 }}>Mr. Reconcile is investigating…</p>
          )}
        </AnswerSection>
      )}

      {investigationSteps.length > 0 && (
        <InvestigationTrace steps={investigationSteps} />
      )}

      {agent.error && (
        <section className="ruled-section error-section" role="alert">
          <div className="error-section__content">
            <h2 className="error-section__title">Investigation unavailable</h2>
            <p className="error-section__body">
              Mr. Reconcile couldn&apos;t complete this investigation. Please
              try again in a moment.
            </p>
          </div>
        </section>
      )}
    </>
  );
}
