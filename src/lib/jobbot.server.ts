import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { FAST_CHAT_MODELS, fastAiOptions } from "@/lib/ai-speed";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  type UIMessage,
} from "ai";

const SYSTEM_PROMPT = `You are JobBot, the friendly AI assistant for JobPortalFree — a free job portal that also offers assessments, resume templates, interview prep, and certifications.

You help users with three things:
1. JOB SEARCH: recommend roles, explain how to browse jobs at /jobs, how to save jobs, set job alerts at /job-alerts, and track applications at /my-applications.
2. CAREER COACHING: give concise, practical advice on resumes (point to /resume-templates), interviews (/interview-prep), certifications (/certifications), and skill building (/assessments).
3. SITE SUPPORT: explain how to register, log in, apply to jobs, contact admin, and use features. If a user reports a bug or needs a human, tell them to use the Contact Admin button in the navbar.

Style: warm, concise, encouraging. Use short paragraphs and bullet points. Use markdown. Never invent job listings — instead direct users to /jobs to browse real ones. If asked something outside careers/jobs/site, politely steer back.`;

function getLastUserText(messages: UIMessage[]) {
  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  return (
    lastUser?.parts
      ?.map((part) => (part.type === "text" ? part.text : ""))
      .join(" ")
      .trim() ?? ""
  );
}

function createTextResponse(text: string, messages: UIMessage[]) {
  const stream = createUIMessageStream({
    originalMessages: messages,
    execute({ writer }) {
      const id = "jobbot-text";
      writer.write({ type: "text-start", id });
      writer.write({ type: "text-delta", id, delta: text });
      writer.write({ type: "text-end", id });
    },
  });

  return createUIMessageStreamResponse({ stream });
}

function createFallbackReply(messages: UIMessage[]) {
  const question = getLastUserText(messages).toLowerCase();

  if (question.includes("resume") || question.includes("cv")) {
    return "I can help with resumes.\n\n- Use a clear one-page format for fresher roles.\n- Add skills, projects, internships, and measurable results.\n- Download ready templates from `/resume-templates`.\n- Tailor keywords to each job before applying.";
  }

  if (question.includes("interview")) {
    return "For interviews, prepare in this order:\n\n- Revise your projects and core skills.\n- Practice common HR questions.\n- Use the STAR method for experience answers.\n- Visit `/interview-prep` for guided practice.";
  }

  if (question.includes("job") || question.includes("apply") || question.includes("application")) {
    return "You can browse and apply for jobs here:\n\n- Open `/jobs` to view current jobs.\n- Save jobs you like.\n- Apply from the job details page.\n- Track submitted applications at `/my-applications`.";
  }

  if (question.includes("assessment") || question.includes("test") || question.includes("coding")) {
    return "For assessments, go to `/assessments`, register or sign in, then start the available test. If a coding runner fails during a test, contact admin from the navbar so they can check that attempt.";
  }

  return "Hi! I’m JobBot. I can help with jobs, resumes, interviews, applications, assessments, and site support.\n\nTry asking things like:\n- Find jobs for freshers\n- Improve my resume\n- Prepare for interviews\n- Track my applications";
}

export async function handleJobBotRequest(request: Request) {
  const { messages } = (await request.json()) as { messages?: UIMessage[] };
  if (!Array.isArray(messages)) {
    return new Response("Messages required", { status: 400 });
  }

  const geminiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env["Gemini API Key"] ||
    process.env["GEMINI API KEY"];

  const models: any[] = [];
  if (geminiKey) models.push(createGoogleGenerativeAI({ apiKey: geminiKey.trim() })(FAST_CHAT_MODELS.gemini));
  if (!models.length) return createTextResponse(createFallbackReply(messages), messages);
  // Only the recent conversation is needed for a good answer, and shorter input answers faster.
  const modelMessages = await convertToModelMessages(messages.slice(-12));

  // Stream the reply so words appear right away; if a provider fails before
  // saying anything, try the next one, then fall back to a canned answer.
  const stream = createUIMessageStream({
    originalMessages: messages,
    async execute({ writer }) {
      const id = "jobbot-text";
      let started = false;
      for (const model of models) {
        try {
          const result = streamText({
            model,
            system: SYSTEM_PROMPT,
            messages: modelMessages,
            providerOptions: fastAiOptions("minimal"),
          });
          for await (const delta of result.textStream) {
            if (!delta) continue;
            if (!started) { writer.write({ type: "text-start", id }); started = true; }
            writer.write({ type: "text-delta", id, delta });
          }
          if (started) { writer.write({ type: "text-end", id }); return; }
        } catch (error) {
          console.error("JobBot provider failed", error);
          if (started) { writer.write({ type: "text-end", id }); return; }
        }
      }
      writer.write({ type: "text-start", id });
      writer.write({ type: "text-delta", id, delta: createFallbackReply(messages) });
      writer.write({ type: "text-end", id });
    },
  });
  return createUIMessageStreamResponse({ stream });
}
