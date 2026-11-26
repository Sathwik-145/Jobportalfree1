import { useEffect, useState } from 'react';
import { Link } from '@/lib/router-compat';
import { loadConcepts, type Concept } from '@/lib/concepts';
import { Brain, BookOpen, Code2, ArrowRight, Star } from 'lucide-react';

const ICONS: Record<string, any> = {
  'DSA': Code2,
  'OOPS': Brain,
  'Operating Systems': BookOpen,
  'SQL & DBMS': BookOpen,
  'Web Development': Code2,
  'Computer Networks': BookOpen,
  'Machine Learning': Brain,
  'System Design': Brain,
};

export default function ImportantConcepts() {
  const [items, setItems] = useState<Concept[]>([]);
  const [activeCat, setActiveCat] = useState<string>('All');

  useEffect(() => { setItems(loadConcepts()); }, []);

  const cats = ['All', ...Array.from(new Set(items.map(i => i.category)))];
  const filtered = activeCat === 'All' ? items : items.filter(i => i.category === activeCat);
  const mustKnow = filtered.filter(i => i.importance === 'must-know');
  const rest = filtered.filter(i => i.importance !== 'must-know');

  return (
    <section className="container px-4 py-12 md:py-16">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
          <Star className="w-3.5 h-3.5 fill-primary" /> MUST-KNOW FOR INTERVIEWS & ASSESSMENTS
        </div>
        <h2 className="font-display text-2xl md:text-3xl font-bold">Important Concepts</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl mx-auto">
          The core topics every candidate is expected to know — DSA, OOPS, OS, DBMS, Web Dev, Networks, ML &amp; System Design.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-6">
        {cats.map(c => (
          <button key={c} onClick={() => setActiveCat(c)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
              activeCat === c ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-muted-foreground hover:text-foreground border-border'
            }`}>{c}</button>
        ))}
      </div>

      {mustKnow.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {mustKnow.map(c => {
            const Icon = ICONS[c.category] || Brain;
            return (
              <div key={c.id} className="bg-card border-2 border-primary/30 rounded-xl p-5 hover:shadow-lg hover:border-primary/60 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-primary text-primary-foreground">Must know</span>
                </div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">{c.category}</p>
                <h3 className="font-display text-base font-bold mb-1">{c.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{c.summary}</p>
                <ul className="space-y-1">
                  {c.bullets.slice(0, 4).map((b, i) => (
                    <li key={i} className="text-xs flex gap-1.5"><span className="text-primary">•</span><span>{b}</span></li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      {rest.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rest.map(c => {
            const Icon = ICONS[c.category] || Brain;
            return (
              <div key={c.id} className="bg-card border rounded-xl p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center"><Icon className="w-4 h-4 text-foreground" /></div>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${c.importance === 'important' ? 'bg-warning/15 text-warning' : 'bg-muted text-muted-foreground'}`}>{c.importance.replace('-', ' ')}</span>
                </div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">{c.category}</p>
                <h3 className="font-display text-base font-bold mb-1">{c.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{c.summary}</p>
                <ul className="space-y-1">
                  {c.bullets.slice(0, 3).map((b, i) => (
                    <li key={i} className="text-xs flex gap-1.5 text-muted-foreground"><span>•</span><span>{b}</span></li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <div className="text-center mt-8">
        <Link to="/interview-prep" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          Deep-dive interview prep <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
