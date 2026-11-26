import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suggestions: string[];
  icon?: ReactNode;
  onEnter?: () => void;
}

export default function AutoSuggest({ value, onChange, placeholder, suggestions, icon, onEnter }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return suggestions.slice(0, 8);
    return suggestions
      .filter((s) => s.toLowerCase().includes(q))
      .sort((a, b) => {
        const ai = a.toLowerCase().startsWith(q) ? 0 : 1;
        const bi = b.toLowerCase().startsWith(q) ? 0 : 1;
        return ai - bi;
      })
      .slice(0, 8);
  }, [value, suggestions]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const highlight = (s: string) => {
    const q = value.trim();
    if (!q) return s;
    const i = s.toLowerCase().indexOf(q.toLowerCase());
    if (i < 0) return s;
    return (
      <>
        {s.slice(0, i)}
        <span className="text-primary font-semibold">{s.slice(i, i + q.length)}</span>
        {s.slice(i + q.length)}
      </>
    );
  };

  return (
    <div ref={rootRef} className="relative flex-1">
      {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none">{icon}</div>}
      <input
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
          else if (e.key === "Enter") {
            if (filtered[active]) { onChange(filtered[active]); setOpen(false); }
            else onEnter?.();
          } else if (e.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 h-11 bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 rounded-xl border border-border bg-popover shadow-2xl backdrop-blur-xl overflow-hidden animate-fade-in">
          <ul className="max-h-72 overflow-y-auto py-1">
            {filtered.map((s, i) => (
              <li
                key={s}
                onMouseDown={(e) => { e.preventDefault(); onChange(s); setOpen(false); }}
                onMouseEnter={() => setActive(i)}
                className={`px-4 py-2 text-sm cursor-pointer transition-colors ${i === active ? "bg-primary/10 text-foreground" : "text-foreground/80"}`}
              >
                {highlight(s)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
