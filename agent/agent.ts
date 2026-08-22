import { defineAgent } from "eve";

export default defineAgent({
  model: "openai/gpt-5.6-luna",
  modelContextWindowTokens: 1_100_000,
  reasoning: "high",
});
