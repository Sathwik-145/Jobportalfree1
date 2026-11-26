import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { useLocation } from '@/lib/router-compat';
import { useFestival, festivalEffect, dayTemplate, type FestivalEffect } from "@/lib/festivals";
import { Button } from "@/components/ui/button";
import { festivalAllowedOn } from "@/lib/examPaths";

const NEUTRAL = ["oklch(0.7 0.12 220)", "oklch(0.75 0.1 180)", "oklch(0.72 0.12 260)"];
const HOLI = ["oklch(0.65 0.25 350)", "oklch(0.85 0.17 95)", "oklch(0.7 0.2 145)", "oklch(0.62 0.2 250)", "oklch(0.7 0.2 40)"];

/** Moving festival background layer. Each effect is pure CSS; counts kept small. */
function Backdrop({ effect, plain = false, aurora = false }: { effect: FestivalEffect; plain?: boolean; aurora?: boolean }) {
  const items = useMemo(() => Array.from({ length: effect === "fireworks" || effect === "colours" ? 9 : 16 }, (_, i) => ({
    left: (i * 37 + 7) % 100, top: (i * 23 + 5) % 70, delay: (i * 0.9) % 8, dur: 5 + ((i * 7) % 7), size: 0.6 + ((i * 13) % 10) / 10, c: (plain ? NEUTRAL : HOLI)[i % (plain ? 3 : HOLI.length)],
  })), [effect, plain]);
  return (
    <div className={`fx-layer fx-${effect} ${plain ? "fx-day" : ""}`} aria-hidden>
      {(!plain || aurora) && <div className="fx-aurora"><i /><i /><i /></div>}
      {items.map((b, i) => (
        <span key={i} className="fx-item" style={{ left: `${b.left}%`, top: `${b.top}%`, animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s`, ["--s" as string]: b.size, ["--c" as string]: b.c }} />
      ))}
      {effect === "tricolour" && !plain && <div className="fx-flagwave" />}
      {effect === "night" && <div className="fx-moon" />}
    </div>
  );
}

/** Festival look (banner, colours, backdrop, particles) or the everyday colour theme. Hidden inside exams. */
export default function FestivalDecor() {
  const { settings: s, festival: f } = useFestival();
  const [closed, setClosed] = useState(false);
  const { pathname } = useLocation();
  // Admin switches decide whether exam pages (student and exam-admin) get the festival look.
  const inExam = !festivalAllowedOn(pathname, s);
  const day = dayTemplate(s.dayTemplate);
  const plainDay = day.id === "default";

  useEffect(() => {
    if (inExam || (!f && plainDay)) return;
    const r = document.documentElement;
    const colors = f ? f.colors : s.dayThemes ? day.colors : null;
    if (!colors) return;
    r.style.setProperty("--fest-1", colors[0]); r.style.setProperty("--fest-2", colors[1]); r.style.setProperty("--fest-3", colors[2]);
    if (f) {
      setClosed(sessionStorage.getItem(`fest-closed-${f.id}`) === "1");
      r.dataset.festival = f.id;
      r.dataset.festivalEffect = festivalEffect(f.id);
      if (s.showColors) r.dataset.festivalColors = "true";
      if (s.showParticles) r.dataset.festivalMotion = "true";
    } else r.dataset.dayTheme = day.id;
    return () => {
      ["festival", "festivalEffect", "festivalColors", "festivalMotion", "dayTheme"].forEach(k => delete r.dataset[k]);
      ["--fest-1", "--fest-2", "--fest-3"].forEach(k => r.style.removeProperty(k));
    };
  }, [f?.id, f?.colors.join(","), s.showColors, s.showParticles, s.dayThemes, inExam, day.id]);

  const bits = useMemo(() => f ? Array.from({ length: 18 }, (_, i) => ({
    ch: f.particles[i % f.particles.length], left: (i * 53) % 100, delay: (i * 1.7) % 12, dur: 10 + ((i * 7) % 9), size: 14 + ((i * 5) % 14),
  })) : [], [f?.id]);

  if (inExam) return null;
  if (!f) return s.dayThemes && !plainDay ? <Backdrop key={day.id} effect={day.effect} plain aurora={!!day.aurora} /> : null;

  return (
    <>
      {s.showParticles && <Backdrop effect={festivalEffect(f.id)} />}
      {s.showBanner && <div className="fest-strip" aria-hidden />}
      {s.showBanner && !closed && (
        <div className="fest-banner" role="status">
          <span className="fest-emoji">{f.emoji}</span>
          <span className="font-semibold tracking-wide">{f.greeting}</span>
          <span className="fest-emoji">{f.emoji}</span>
          <Button size="icon" variant="ghost" aria-label="Hide greeting" className="fest-close" onClick={() => { sessionStorage.setItem(`fest-closed-${f.id}`, "1"); setClosed(true); }}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}
      {s.showParticles && (
        <div className="fest-particles" aria-hidden>
          {bits.map((b, i) => (
            <span key={i} style={{ left: `${b.left}%`, animationDelay: `${b.delay}s`, animationDuration: `${b.dur}s`, fontSize: b.size }}>{b.ch}</span>
          ))}
        </div>
      )}
    </>
  );
}
