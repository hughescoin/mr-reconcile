export function AskPanel({
  label = "Ask a question",
  placeholder = "Where are my funds for pay_2007?",
  ctaLabel = "Investigate",
  value,
  onValueChange,
  onSubmit,
  disabled = false,
  statusMessage = "Investigating authoritative records…",
  children,
}: {
  label?: string;
  placeholder?: string;
  ctaLabel?: string;
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  disabled?: boolean;
  statusMessage?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="ask-section" id="ask">
      <div className="ask-panel">
        <label className="overline" htmlFor="reconciliation-question">
          {label}
        </label>

        <form
          className="ask-row"
          aria-busy={disabled}
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
        >
          <input
            id="reconciliation-question"
            type="text"
            className="ask-input"
            placeholder={placeholder}
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            disabled={disabled}
            aria-describedby="ask-status"
          />

          <button
            type="submit"
            className="ask-cta"
            disabled={disabled}
          >
            {disabled && (
              <span className="ask-cta__spinner" aria-hidden="true" />
            )}
            <span>{disabled ? "Investigating…" : ctaLabel}</span>
          </button>
        </form>

        <div
          className={`ask-status${disabled ? " ask-status--active" : ""}`}
          id="ask-status"
          role="status"
          aria-live="polite"
        >
          {disabled ? statusMessage : ""}
        </div>

        {children}
      </div>
    </section>
  );
}
