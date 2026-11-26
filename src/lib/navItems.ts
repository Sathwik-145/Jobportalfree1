import {
  Briefcase, BellRing, BookmarkCheck, FileText, ClipboardCheck, GraduationCap, Mic, Lightbulb, Award,
  Code2, MessagesSquare, Mail,
} from "lucide-react";

export type NavItem = { to: string; label: string; desc?: string; icon: typeof Briefcase; badge?: string };

/** Everything a student can use, grouped in one menu (desktop hover panel and phone sheet). */
export const EVERYTHING: { group: string; blurb: string; items: NavItem[] }[] = [
  {
    group: "Find work",
    blurb: "Openings and your shortlist",
    items: [
      { to: "/jobs", label: "Browse jobs", desc: "Fresh, verified openings", icon: Briefcase },
      { to: "/job-alerts", label: "Job alerts", desc: "Get matches by email", icon: BellRing },
      { to: "/saved-jobs", label: "Saved jobs", desc: "Your shortlist", icon: BookmarkCheck },
      { to: "/my-applications", label: "My applications", desc: "Track every status", icon: FileText },
    ],
  },
  {
    group: "Prepare",
    blurb: "Practice before the real thing",
    items: [
      { to: "/assessments", label: "Skill assessments", desc: "Free timed practice tests", icon: ClipboardCheck },
      { to: "/interview-prep", label: "Interview prep", desc: "Questions & tips", icon: GraduationCap },
      { to: "/mock-interviews", label: "Mock interviews", desc: "Practice live rounds", icon: Mic, badge: "Soon" },
      { to: "/admin/concepts", label: "Important concepts", desc: "Quick revision notes", icon: Lightbulb },
      { to: "/certifications", label: "Certifications", desc: "Free courses that count", icon: Award },
      { to: "/resume-templates", label: "Resume templates", desc: "Ready to download", icon: FileText },
    ],
  },
  {
    group: "Exams & help",
    blurb: "Your tests and quick answers",
    items: [
      { to: "/exam-login", label: "CodeXam exam login", desc: "Your assigned exams", icon: Code2 },
      { to: "/start", label: "Quick start an exam", desc: "Begin in seconds", icon: ClipboardCheck },
      { to: "/chat", label: "JobBot AI chat", desc: "Ask anything about careers", icon: MessagesSquare, badge: "AI" },
      { to: "/contact", label: "Contact us", desc: "We reply fast", icon: Mail },
    ],
  },
];
