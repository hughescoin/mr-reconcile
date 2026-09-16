export interface PreparedChatSubmission {
  clearedInput: "";
  question: string;
}

export function prepareChatSubmission(
  input: string,
  submissionActive: boolean,
): PreparedChatSubmission | null {
  if (submissionActive) {
    return null;
  }

  const question = input.trim();

  if (!question) {
    return null;
  }

  return {
    clearedInput: "",
    question,
  };
}
