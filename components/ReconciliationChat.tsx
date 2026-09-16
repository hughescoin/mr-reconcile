"use client";

import { useEveAgent } from "eve/react";
import { useEffect, useRef, useState } from "react";
import { AnswerSection } from "@/components/AnswerSection";
import { AskPanel } from "@/components/AskPanel";
import { ExamplePromptChips } from "@/components/ExamplePromptChips";
import { InvestigationTrace } from "@/components/InvestigationTrace";
import { StatusBadge } from "@/components/StatusBadge";
import { prepareChatSubmission } from "@/lib/chat-submission";
import {
  loadSavedEveChat,
  resumeSavedEveChat,
  saveEveChat,
  type SavedEveChat,
} from "@/lib/eve-chat-persistence";
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
  const [savedChat, setSavedChat] = useState<SavedEveChat>();

  useEffect(() => {
    let active = true;
    const storage = window.localStorage;
    const saved = loadSavedEveChat(storage);

    void resumeSavedEveChat(storage, saved).then((resumed) => {
      if (active) {
        setSavedChat(resumed);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  if (!savedChat) {
    return null;
  }

  return <ReconciliationChatSession savedChat={savedChat} />;
}

function ReconciliationChatSession({ savedChat }: { savedChat: SavedEveChat }) {
  const [input, setInput] = useState("");
  const [submissionPending, setSubmissionPending] = useState(false);
  const [activeSubmission, setActiveSubmission] = useState<{
    previousAssistantId?: string;
    question: string;
  }>();
  const submissionLock = useRef(false);
  const persistedEvents = useRef([...savedChat.events]);
  const persistedSession = useRef(savedChat.session);
  const agent = useEveAgent({
    initialEvents: savedChat.events,
    initialSession: savedChat.session,
    optimistic: true,
    onEvent(event) {
      persistedEvents.current = [...persistedEvents.current, event];
      persistChat({
        events: persistedEvents.current,
        session: persistedSession.current,
      });
    },
    onSessionChange(session) {
      persistedSession.current = session;
      persistChat({
        events: persistedEvents.current,
        session,
      });
    },
    onFinish(snapshot) {
      persistedEvents.current = [...snapshot.events];
      persistedSession.current = snapshot.session;
      persistChat({
        events: snapshot.events,
        session: snapshot.session,
      });
    },
  });
  const { messages } = agent.data;
  const latestUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");
  const latestAssistantMessage = [...messages]
    .reverse()
    .find((message) => message.role === "assistant");
  const question =
    activeSubmission?.question ??
    latestUserMessage?.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("") ??
    "";
  const assistantMatchesActiveSubmission =
    !activeSubmission ||
    latestAssistantMessage?.id !== activeSubmission.previousAssistantId;
  const answer =
    assistantMatchesActiveSubmission
      ? latestAssistantMessage?.parts
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("") ?? ""
      : "";
  const isInvestigating =
    submissionPending ||
    agent.status === "submitted" ||
    agent.status === "streaming";
  const investigationSteps =
    agent.status === "submitted"
      ? []
      : mapEveInvestigationSteps(agent.events);

  const settlementStep = investigationSteps.find(
    (step) => step.type === "settlement",
  );
  const responseStatus =
    investigationSteps.length > 0
      ? "Reviewing payment, transaction, and settlement records…"
      : "Starting a reconciliation investigation…";

  async function handleSubmit() {
    const submission = prepareChatSubmission(
      input,
      submissionLock.current || isInvestigating,
    );

    if (!submission) {
      return;
    }

    submissionLock.current = true;
    setInput(submission.clearedInput);
    setSubmissionPending(true);
    setActiveSubmission({
      previousAssistantId: latestAssistantMessage?.id,
      question: submission.question,
    });

    try {
      await agent.send(submission.question);
    } finally {
      submissionLock.current = false;
      setSubmissionPending(false);
    }
  }

  return (
    <>
      <AskPanel
        value={input}
        onValueChange={setInput}
        onSubmit={handleSubmit}
        disabled={isInvestigating}
        statusMessage={responseStatus}
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
            disabled={isInvestigating}
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
            <p className="answer-copy" aria-live="polite">
              {answer}
            </p>
          ) : (
            <div className="response-state" role="status" aria-live="polite">
              <span className="response-state__indicator" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              <span>{responseStatus}</span>
            </div>
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

function persistChat(chat: SavedEveChat) {
  saveEveChat(
    typeof window === "undefined" ? undefined : window.localStorage,
    chat,
  );
}
