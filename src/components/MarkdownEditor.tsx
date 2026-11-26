import { useCallback, useEffect, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Table,
  Link,
  Minus,
  Quote,
  Code,
  Palette,
  Eye,
  Edit3,
  type LucideIcon,
} from "lucide-react";
import MarkdownContent from "@/components/MarkdownContent";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

const COLORS = [
  { label: "Primary", swatch: "hsl(var(--primary))", value: "hsl(var(--primary))" },
  { label: "Secondary", swatch: "hsl(var(--secondary))", value: "hsl(var(--secondary))" },
  { label: "Accent", swatch: "hsl(var(--accent))", value: "hsl(var(--accent))" },
  { label: "Destructive", swatch: "hsl(var(--destructive))", value: "hsl(var(--destructive))" },
  { label: "Foreground", swatch: "hsl(var(--foreground))", value: "hsl(var(--foreground))" },
  { label: "Muted", swatch: "hsl(var(--muted-foreground))", value: "hsl(var(--muted-foreground))" },
] as const;

type Tool = {
  icon: LucideIcon;
  label: string;
  action: () => void;
};

const MarkdownEditor = ({ value, onChange, placeholder, rows = 8 }: MarkdownEditorProps) => {
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resizeTextarea = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    ta.style.height = "0px";
    const minHeight = Math.max(rows * 24, 140);
    const maxHeight = 520;
    const nextHeight = Math.min(Math.max(ta.scrollHeight, minHeight), maxHeight);

    ta.style.height = `${nextHeight}px`;
    ta.style.overflowY = ta.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [rows]);

  useEffect(() => {
    if (!preview) {
      requestAnimationFrame(resizeTextarea);
    }
  }, [preview, value, resizeTextarea]);

  const commitAndFocus = useCallback(
    (nextValue: string, selectionStart: number, selectionEnd: number) => {
      onChange(nextValue);
      requestAnimationFrame(() => {
        const ta = textareaRef.current;
        if (!ta) return;
        ta.focus();
        ta.setSelectionRange(selectionStart, selectionEnd);
        resizeTextarea();
      });
    },
    [onChange, resizeTextarea],
  );

  const wrapSelection = useCallback(
    (before: string, after = "", defaultText = "") => {
      const ta = textareaRef.current;
      if (!ta) return;

      const current = ta.value;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = current.slice(start, end);
      const text = selected || defaultText;

      const nextValue = current.slice(0, start) + before + text + after + current.slice(end);

      if (selected) {
        commitAndFocus(nextValue, start + before.length, start + before.length + text.length);
      } else {
        const cursor = start + before.length + text.length + after.length;
        commitAndFocus(nextValue, cursor, cursor);
      }
    },
    [commitAndFocus],
  );

  const insertAtCursor = useCallback(
    (text: string) => {
      const ta = textareaRef.current;
      if (!ta) return;

      const current = ta.value;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const nextValue = current.slice(0, start) + text + current.slice(end);
      const cursor = start + text.length;

      commitAndFocus(nextValue, cursor, cursor);
    },
    [commitAndFocus],
  );

  const prefixLines = useCallback(
    (prefix: string, numbered = false) => {
      const ta = textareaRef.current;
      if (!ta) return;

      const current = ta.value;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;

      const lineStart = current.lastIndexOf("\n", start - 1) + 1;
      const lineEnd = current.indexOf("\n", end);
      const actualEnd = lineEnd === -1 ? current.length : lineEnd;
      const block = current.slice(lineStart, actualEnd);

      const nextBlock = block
        .split("\n")
        .map((line, index) => {
          if (!line.trim()) return line;

          if (numbered) {
            return `${index + 1}. ${line.replace(/^\d+\.\s+/, "")}`;
          }

          if (prefix.startsWith("#")) {
            return `${prefix}${line.replace(/^#{1,6}\s+/, "")}`;
          }

          if (prefix === "- ") {
            return `${prefix}${line.replace(/^[-*+]\s+/, "")}`;
          }

          if (prefix === "> ") {
            return `${prefix}${line.replace(/^>\s+/, "")}`;
          }

          return `${prefix}${line}`;
        })
        .join("\n");

      const nextValue = current.slice(0, lineStart) + nextBlock + current.slice(actualEnd);
      commitAndFocus(nextValue, lineStart, lineStart + nextBlock.length);
    },
    [commitAndFocus],
  );

  const tools: Tool[] = [
    { icon: Bold, label: "Bold", action: () => wrapSelection("**", "**", "bold text") },
    { icon: Italic, label: "Italic", action: () => wrapSelection("*", "*", "italic text") },
    { icon: Underline, label: "Underline", action: () => wrapSelection("<u>", "</u>", "underlined text") },
    { icon: Heading1, label: "Heading 1", action: () => prefixLines("# ") },
    { icon: Heading2, label: "Heading 2", action: () => prefixLines("## ") },
    { icon: Heading3, label: "Heading 3", action: () => prefixLines("### ") },
    { icon: List, label: "Bullet List", action: () => prefixLines("- ") },
    { icon: ListOrdered, label: "Numbered List", action: () => prefixLines("", true) },
    { icon: Quote, label: "Quote", action: () => prefixLines("> ") },
    { icon: Minus, label: "Divider", action: () => insertAtCursor("\n\n---\n\n") },
    {
      icon: Table,
      label: "Table",
      action: () =>
        insertAtCursor(
          "\n\n| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Value 1 | Value 2 | Value 3 |\n| Value 4 | Value 5 | Value 6 |\n\n",
        ),
    },
    { icon: Link, label: "Link", action: () => wrapSelection("[", "](https://example.com)", "link text") },
    { icon: Code, label: "Code Block", action: () => wrapSelection("\n```\n", "\n```\n", "code") },
  ];

  return (
    <div className="overflow-hidden rounded-md border border-border bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 p-2">
        {tools.map((tool) => (
          <Button
            key={tool.label}
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            title={tool.label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={tool.action}
          >
            <tool.icon className="h-4 w-4" />
          </Button>
        ))}

        <div className="mx-1 h-6 w-px bg-border" />

        <div className="flex items-center gap-1">
          <span className="flex items-center text-muted-foreground" title="Text color">
            <Palette className="h-4 w-4" />
          </span>
          {COLORS.map((color) => (
            <button
              key={color.label}
              type="button"
              title={color.label}
              className="h-6 w-6 rounded-full border border-border transition-transform hover:scale-105"
              style={{ backgroundColor: color.swatch }}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => wrapSelection(`<span style=\"color:${color.value}\">`, "</span>", "colored text")}
            />
          ))}
        </div>

        <div className="ml-auto">
          <Button
            type="button"
            variant={preview ? "secondary" : "ghost"}
            size="sm"
            className="h-8 gap-1 text-xs"
            onClick={() => setPreview((prev) => !prev)}
          >
            {preview ? <Edit3 className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            {preview ? "Edit" : "Preview"}
          </Button>
        </div>
      </div>

      {preview ? (
        <div className="min-h-[200px] p-4">
          {value.trim() ? (
            <MarkdownContent content={value} />
          ) : (
            <p className="italic text-muted-foreground">Nothing to preview</p>
          )}
        </div>
      ) : (
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onInput={resizeTextarea}
          placeholder={placeholder}
          rows={rows}
          className="min-h-[140px] max-h-[520px] resize-none rounded-none border-0 font-mono text-sm leading-6 focus-visible:ring-0"
        />
      )}
    </div>
  );
};

export default MarkdownEditor;
