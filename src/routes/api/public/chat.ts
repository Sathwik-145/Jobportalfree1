import { createFileRoute } from "@tanstack/react-router";
import { handleJobBotRequest } from "@/lib/jobbot.server";

export const Route = createFileRoute("/api/public/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => handleJobBotRequest(request),
    },
  },
});
