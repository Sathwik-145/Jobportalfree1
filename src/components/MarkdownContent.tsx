import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

const markdownComponents: Components = {
  h1: ({ children }) => <h1 className="mt-6 mb-3 text-2xl font-bold text-foreground">{children}</h1>,
  h2: ({ children }) => <h2 className="mt-5 mb-3 text-xl font-bold text-foreground">{children}</h2>,
  h3: ({ children }) => <h3 className="mt-4 mb-2 text-lg font-semibold text-foreground">{children}</h3>,
  p: ({ children }) => <p className="mb-3 leading-7 text-foreground/90">{children}</p>,
  strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
  ul: ({ children }) => <ul className="mb-3 list-disc pl-6 space-y-1 text-foreground/90">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal pl-6 space-y-1 text-foreground/90">{children}</ol>,
  li: ({ children }) => <li>{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-4 border-border bg-muted/40 px-4 py-2 italic text-foreground/80">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-border" />,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
      {children}
    </a>
  ),
  table: ({ children }) => <table className="my-4 w-full border-collapse border border-border text-sm">{children}</table>,
  thead: ({ children }) => <thead className="bg-muted/60">{children}</thead>,
  th: ({ children }) => <th className="border border-border px-3 py-2 text-left font-semibold text-foreground">{children}</th>,
  td: ({ children }) => <td className="border border-border px-3 py-2 align-top text-foreground/90">{children}</td>,
  code: ({ className, children, ...props }) => {
    const isBlockCode = Boolean(className);

    return (
      <code
        className={cn(
          isBlockCode
            ? "font-mono text-sm text-foreground"
            : "rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded-md border border-border bg-muted/30 p-3">{children}</pre>
  ),
};

const MarkdownContent = ({ content, className }: MarkdownContentProps) => {
  if (!content?.trim()) return null;

  return (
    <div className={cn("markdown-content", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownContent;
