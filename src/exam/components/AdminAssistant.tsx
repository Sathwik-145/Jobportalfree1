import { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import ReactMarkdown from 'react-markdown';
import { Sparkles, X, Send, Copy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/db-client';
import { Button } from '@/components/ui/button';
import { saveDraft } from './assistant-storage';
import { useAuth as useExamAuth } from '@/exam/contexts/ExamAuthContext';
import { useLocation } from '@/lib/router-compat';
import { toast } from 'sonner';
import { draftSchema, emailSchema, type DraftQuestion } from '@/lib/admin-assistant-schema';

const transport = new DefaultChatTransport({ api: '/api/admin-assistant', headers: async () => {
  const { data } = await supabase.auth.getSession();
  return { Authorization: `Bearer ${data.session?.access_token || ''}` };
} });

function QuestionCard({ question, testId, addAll }: { question: DraftQuestion; testId?: string; addAll: number }) {
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const id = useRef(crypto.randomUUID());
  async function save() {
    if (state !== 'idle') return;
    setState('saving');
    try { await saveDraft(question, testId, id.current); setState('saved'); toast.success('Question added'); }
    catch (e) { setState('idle'); toast.error(e instanceof Error ? e.message : 'Could not save question'); }
  }
  useEffect(() => { if (addAll > 0) void save(); }, [addAll]);
  return <article className="my-3 rounded-lg border bg-background p-3 text-sm">
    <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{question.type} draft · Review before adding</p>
    <ReactMarkdown>{'question' in question ? question.question : 'sentence' in question ? question.sentence : question.title}</ReactMarkdown>
    {'description' in question && <ReactMarkdown>{question.description}</ReactMarkdown>}
    {'prompt' in question && <ReactMarkdown>{question.prompt}</ReactMarkdown>}
    {question.type === 'mcq' && <ol className="my-2 list-decimal pl-5">{question.options.map((o, i) => <li key={i}>{o}{i === question.correct_index ? ' ✓' : ''}</li>)}</ol>}
    {question.type === 'fib' && <p className="my-2">Accepted answers: {question.answers.join(', ')}</p>}
    {'explanation' in question && <p className="my-2 text-muted-foreground">{question.explanation}</p>}
    {question.type === 'coding' && <details className="my-2"><summary>Review test cases and settings</summary><pre className="overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify(question, null, 2)}</pre></details>}
    {question.type === 'writing' && <p className="my-2">{question.min_words}–{question.max_words} words · {question.marks} marks</p>}
    <Button size="sm" className="mt-2" disabled={state !== 'idle'} onClick={save}>{state === 'saved' ? 'Added to bank' : state === 'saving' ? 'Adding…' : 'Add'}</Button>
  </article>;
}

function DraftBatch({ questions }: { questions: DraftQuestion[] }) {
  const { exams } = useExamAuth();
  const [testId, setTestId] = useState('');
  const [addAll, setAddAll] = useState(0);
  return <div><label className="block text-sm">Also add to test (optional)<select aria-label="Choose test" className="my-2 w-full rounded-md border bg-background p-2" value={testId} onChange={e => setTestId(e.target.value)}><option value="">Bank only</option>{exams.filter(e => e.status === 'draft').map(e => <option key={e.id} value={e.id}>{e.title}</option>)}</select></label><Button size="sm" variant="outline" onClick={() => setAddAll(n => n + 1)}>Add all</Button>{questions.map((q, i) => <QuestionCard key={i} question={q} testId={testId || undefined} addAll={addAll} />)}</div>;
}

function AssistantChat() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const adminRoute = location.pathname.startsWith('/exam-admin') || location.pathname.startsWith('/admin');
  const [input, setInput] = useState('');
  const { messages, sendMessage, status, error, stop } = useChat({ transport });
  const end = useRef<HTMLDivElement>(null);
  const busy = status === 'streaming' || status === 'submitted';
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, open]);
  async function copy(text: string) { try { await navigator.clipboard.writeText(text); toast.success('Copied'); } catch { toast.error('Could not copy. Please select and copy the text.'); } }
  function submit(text: string) { if (!text.trim() || busy) return; setInput(''); void sendMessage({ text: text.trim() }); }
  return <div hidden={!adminRoute}>
    <Button className="fixed bottom-5 right-5 z-[60] h-14 rounded-full shadow-lg" aria-label="Open admin AI assistant" onClick={() => setOpen(true)}><Sparkles className="mr-2 h-5 w-5" />Admin AI</Button>
    {open && <section role="region" aria-label="Admin assistant" className="fixed bottom-20 right-3 z-[70] flex h-[min(75dvh,700px)] w-[min(calc(100vw-1.5rem),32rem)] flex-col overflow-hidden rounded-xl border bg-background shadow-xl"><Button variant="ghost" size="icon" className="absolute right-2 top-2" aria-label="Close admin assistant" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
      <header className="border-b p-5 pr-12"><h2 className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Admin assistant</h2><p>Draft, review, and manage with AI. This conversation is not saved.</p></header>
      <div className="flex-1 overflow-y-auto p-4" aria-live="polite">
        {!messages.length && <div className="space-y-3 py-6"><h3 className="font-semibold">What can I help you with?</h3>{['Draft 3 easy JavaScript MCQs', 'Help me rewrite an email', 'How do I manage question banks?'].map(text => <Button key={text} variant="outline" className="h-auto w-full justify-start whitespace-normal text-left" onClick={() => submit(text)}>{text}</Button>)}</div>}
        {messages.map(message => <div key={message.id} className={`mb-4 rounded-lg p-3 ${message.role === 'user' ? 'bg-primary/10' : 'bg-muted'}`}>
          <p className="mb-2 text-xs font-semibold text-muted-foreground">{message.role === 'user' ? 'You' : 'Admin AI'}</p>
          {message.parts.map((part, i) => {
            if (part.type === 'text') return <div key={i} className="prose prose-sm max-w-none break-words text-foreground dark:prose-invert"><ReactMarkdown>{part.text}</ReactMarkdown></div>;
            if (part.type === 'tool-draft_questions' && part.state === 'output-available') {
              const parsed = draftSchema.safeParse(part.output);
              return parsed.success ? <DraftBatch key={i} questions={parsed.data.questions} /> : <p key={i}>The draft was invalid. Please ask me to try again.</p>;
            }
            if (part.type === 'tool-rewrite_email' && part.state === 'output-available') {
              const parsed = emailSchema.safeParse(part.output);
              if (!parsed.success) return null;
              const email = parsed.data;
              return <article key={i} className="my-2 rounded-lg border bg-background p-3"><strong>{email.subject}</strong><p className="my-3 whitespace-pre-wrap">{email.body}</p><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => copy(email.subject)}><Copy className="mr-1 h-3 w-3" />Subject</Button><Button size="sm" variant="outline" onClick={() => copy(email.body)}>Copy body</Button><Button size="sm" variant="outline" onClick={() => copy(`Subject: ${email.subject}\n\n${email.body}`)}>Copy email</Button></div></article>;
            }
            return null;
          })}
        </div>)}
        {busy && <p className="text-sm text-muted-foreground">Working on your request…</p>}
        {error && <p role="alert" className="rounded-lg border border-destructive p-3 text-sm text-destructive">{error.message.includes('429') ? 'Too many requests. Please wait and try again.' : error.message.includes('402') ? 'AI credits are exhausted. Please top up workspace credits.' : error.message || 'Unable to connect. Please try again.'}</p>}
        <div ref={end} />
      </div>
      <form className="flex gap-2 border-t p-4" onSubmit={e => { e.preventDefault(); submit(input); }}><textarea aria-label="Message the admin assistant" placeholder="Ask about the admin panel…" className="min-h-12 flex-1 resize-none rounded-md border bg-background p-2 text-sm" value={input} onChange={e => setInput(e.target.value)} maxLength={15000} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(input); } }} />{busy ? <Button type="button" variant="outline" aria-label="Stop response" onClick={() => void stop()}><X className="h-4 w-4" /></Button> : <Button type="submit" disabled={!input.trim()} aria-label="Send message"><Send className="h-4 w-4" /></Button>}</form>
    </section>}
  </div>;
}
export default function AdminAssistant() {
  const { isAdmin, session } = useAuth();
  return isAdmin && session ? <AssistantChat key={session.user.id} /> : null;
}
