/**
 * Request options that make AI replies come back quickly.
 * Direct Gemini calls get no thinking settings: Gemini 3 and 2.5 accept different thinking fields and
 * reject the other one, which silently broke the chat. Speed comes from the lite model instead.
 * The speed argument is kept so call sites can say how much accuracy they need.
 */
/** Quickest model for live chat replies (first words in well under a second). */
export const FAST_CHAT_MODELS = {
  gemini: "gemini-flash-lite-latest",
} as const;

export type AiSpeed = "minimal" | "low";

export function fastAiOptions(_speed: AiSpeed = "minimal"): Record<string, never> {
  return {};
}
