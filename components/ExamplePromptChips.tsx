export function ExamplePromptChips({
  prompts,
  onSelect,
  disabled = false,
}: {
  prompts: string[];
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="prompt-chips" aria-label="Example questions">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          className="chip"
          onClick={() => onSelect(prompt)}
          disabled={disabled}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
