import { useLocation } from "@/lib/router-compat";
import { isExamPage } from "@/lib/examPaths";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle, X, Send, Sparkles, Trash2, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from '@/lib/router-compat';

const STORAGE_KEY = "jobportal_chat_messages_v1";

function loadMessages(): UIMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function renderText(message: UIMessage): string {
  return message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");
}

interface ChatWindowProps {
  fullPage?: boolean;
  onClose?: () => void;
}

export function ChatWindow({ fullPage = false, onClose }: ChatWindowProps) {
  const [initialMessages] = useState<UIMessage[]>(() => loadMessages());
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, setMessages, error } = useChat({
    id: "jobportal-main",
    messages: initialMessages,
    transport: new DefaultChatTransport({ api: "/api/public/chat" }),
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [status]);

  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = async (e?: React.FormEvent, overrideText?: string) => {
    e?.preventDefault();
    const text = (overrideText ?? input).trim();
    if (!text || isLoading) return;
    setInput("");
    await sendMessage({ text });
  };

  const clearChat = () => {
    setMessages([]);
    try { window.localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const suggestions = [
    "Help me find a job",
    "Tips to improve my resume",
    "How do I prepare for interviews?",
    "How to track my applications?",
  ];

  return (
    <div className={cn("flex flex-col bg-card", fullPage ? "h-[calc(100vh-8rem)] rounded-2xl border shadow-xl" : "h-[560px] max-h-[80vh] w-[380px] max-w-[calc(100vw-2rem)] rounded-2xl border shadow-2xl")}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 p-3 border-b bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 rounded-t-2xl">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0 shadow-md shadow-primary/30">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="font-display font-semibold text-sm truncate">JobBot Assistant</div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Online · AI-powered
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearChat} title="Clear chat">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          {!fullPage && (
            <Link to="/chat" onClick={onClose}>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="Open full page">
                <Maximize2 className="w-4 h-4" />
              </Button>
            </Link>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose} title="Close">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="text-center py-4">
              <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 items-center justify-center mb-3">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-base">Hey! I'm JobBot 👋</h3>
              <p className="text-xs text-muted-foreground mt-1 px-4">Ask me about jobs, resumes, interviews, or how to use the site.</p>
            </div>
            <div className="grid gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSubmit(undefined, s)}
                  className="text-left text-xs px-3 py-2 rounded-lg border border-border hover:border-primary hover:bg-primary/5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => {
          const text = renderText(m);
          if (!text) return null;
          const isUser = m.role === "user";
          return (
            <div key={m.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
              <div className={cn(
                "rounded-2xl px-3.5 py-2 text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed",
                isUser
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              )}>
                {text}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-3.5 py-2.5 text-sm">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce [animation-delay:0.3s]" />
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="text-xs text-destructive bg-destructive/10 rounded-lg p-2">
            {error.message?.includes("402")
              ? "AI credits exhausted. Please add credits in workspace billing."
              : error.message?.includes("429")
              ? "Too many requests. Please slow down."
              : "Something went wrong. Please try again."}
          </div>
        )}
      </div>

      {/* Composer */}
      <form onSubmit={handleSubmit} className="p-3 border-t bg-background/50 rounded-b-2xl">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ask anything about jobs, resumes…"
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring max-h-32"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="shrink-0 rounded-xl">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 text-center">JobBot can make mistakes. Verify important info.</p>
      </form>
    </div>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const { isAdmin } = useAuth();
  const { pathname } = useLocation();
  // No help chat anywhere inside the exam portal.
  if (isAdmin || isExamPage(pathname)) return null;

  return (
    <>
      {/* Floating bubble */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "chat-fab fixed bottom-5 right-5 z-[60] w-14 h-14 rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center transition-all hover:scale-110 active:scale-95",
          "bg-gradient-to-br from-primary via-secondary to-accent text-primary-foreground",
          open && "rotate-90"
        )}
        aria-label={open ? "Close chat" : "Open chat assistant"}
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-green-500 ring-2 ring-background animate-pulse" />
        )}
      </button>

      {/* Popover panel */}
      {open && (
        <div className="chat-panel fixed bottom-24 right-5 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-200">
          <ChatWindow onClose={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
