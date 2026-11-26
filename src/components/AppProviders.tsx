import type { ReactNode } from "react";
import AdminAssistant from "@/exam/components/AdminAssistant";
import PortalBranding from "@/components/PortalBranding";
import FestivalDecor from "@/components/FestivalDecor";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import ThemeApplier from "@/components/ThemeApplier";
import AuthGate from "@/components/AuthGate";
import ChatWidget from "@/components/ChatWidget";
import NavProgress from "@/components/NavProgress";
import { AuthProvider as ExamAuthProvider } from "@/exam/contexts/ExamAuthContext";

// Any site visit also nudges the credential-mail schedule (max once per 10 min per browser).
if (typeof window !== "undefined") {
  try {
    const k = "codexam_sched_ping";
    const last = Number(localStorage.getItem(k) || 0);
    if (Date.now() - last > 10 * 60 * 1000) {
      localStorage.setItem(k, String(Date.now()));
      fetch("/api/public/run-mail-schedule").catch(() => {});
    }
  } catch {}
}

/** Browser-only app shell shared by every page: themes, both sign-in systems, toasts and assistants. */
export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <ThemeApplier />
      <TooltipProvider>
        <NavProgress />
        <Toaster />
        <Sonner />
        <PortalBranding />
        <FestivalDecor />
        <AuthProvider>
          <ExamAuthProvider>
            <AuthGate>
              {children}
              <ChatWidget />
              <AdminAssistant />
            </AuthGate>
          </ExamAuthProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
