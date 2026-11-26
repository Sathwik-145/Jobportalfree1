import { createFileRoute } from "@tanstack/react-router";
import { handleCodeRunnerOptions, handleCodeRunnerRequest } from "@/lib/code-runner.server";

export const Route = createFileRoute("/api/execute-code")({
  server: {
    handlers: {
      OPTIONS: async () => handleCodeRunnerOptions(),
      POST: async ({ request }) => handleCodeRunnerRequest(request),
    },
  },
});
