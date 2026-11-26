import { buildDocument, type ResumeData } from "@/lib/resumeModel";
import { templateById, type TemplateId } from "@/lib/resumeTemplates";

/** Draws the resume as selectable text (ATS friendly) and returns the jsPDF document. */
export async function buildResumePdf(data: ResumeData, templateId: TemplateId) {
  const mod = await import("jspdf");
  const JsPDF = (mod as any).jsPDF || (mod as any).default;
  const doc = new JsPDF({ unit: "pt", format: "a4" });
  const tpl = templateById(templateId);
  const rd = buildDocument(data);

  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 42;
  const maxW = W - M * 2;
  const lh = tpl.bodySize * 1.38;
  let y = M;

  const ensure = (h: number) => { if (y + h > H - M) { doc.addPage(); y = M; } };
  const font = (style: "normal" | "bold" | "italic", size: number, color: [number, number, number] = [30, 30, 30]) => {
    doc.setFont(tpl.font, style); doc.setFontSize(size); doc.setTextColor(...color);
  };

  // Header
  if (rd.name) {
    font("bold", tpl.nameSize, tpl.accent);
    ensure(tpl.nameSize + 4);
    y += tpl.nameSize;
    doc.text(rd.name, tpl.align === "center" ? W / 2 : M, y, { align: tpl.align === "center" ? "center" : "left" });
  }
  if (rd.title) {
    font("normal", tpl.bodySize + 1.5, [80, 80, 80]);
    y += lh + 1;
    doc.text(rd.title, tpl.align === "center" ? W / 2 : M, y, { align: tpl.align === "center" ? "center" : "left" });
  }
  if (rd.contact.length) {
    font("normal", tpl.bodySize - 0.5, [70, 70, 70]);
    const lines: string[] = doc.splitTextToSize(rd.contact.join("  |  "), maxW);
    for (const l of lines) {
      y += lh;
      doc.text(l, tpl.align === "center" ? W / 2 : M, y, { align: tpl.align === "center" ? "center" : "left" });
    }
  }
  y += 6;

  for (const sec of rd.sections) {
    ensure(tpl.sectionGap + lh * 3);
    y += tpl.sectionGap;
    font("bold", tpl.bodySize + 0.5, tpl.accent);
    y += lh;
    doc.text(sec.title.toUpperCase(), M, y);
    if (tpl.ruleUnderSection) {
      doc.setDrawColor(...tpl.accent); doc.setLineWidth(0.6);
      doc.line(M, y + 3, W - M, y + 3);
    }
    y += 4;

    for (const line of sec.lines) {
      if (line.kind === "row") {
        ensure(lh * 2);
        y += lh + 1;
        font("bold", tpl.bodySize);
        let right = "";
        if (line.right) { font("normal", tpl.bodySize, [90, 90, 90]); right = line.right; }
        const rightW = right ? doc.getTextWidth(right) + 8 : 0;
        font("bold", tpl.bodySize);
        const left: string[] = doc.splitTextToSize(line.left, maxW - rightW);
        doc.text(left[0] || "", M, y);
        if (right) { font("normal", tpl.bodySize, [90, 90, 90]); doc.text(right, W - M, y, { align: "right" }); }
        for (const extra of left.slice(1)) { font("bold", tpl.bodySize); y += lh; doc.text(extra, M, y); }
        if (line.sub) { font("italic", tpl.bodySize, [70, 70, 70]); y += lh; doc.text(doc.splitTextToSize(line.sub, maxW)[0], M, y); }
      } else {
        const isBullet = line.kind === "bullet";
        const indent = isBullet ? 12 : 0;
        font("normal", tpl.bodySize);
        const wrapped: string[] = doc.splitTextToSize(line.text, maxW - indent);
        wrapped.forEach((l, i) => {
          ensure(lh);
          y += lh;
          if (isBullet && i === 0) doc.text("•", M + 3, y);
          doc.text(l, M + indent, y);
        });
      }
    }
  }
  return doc;
}

export async function downloadResumePdf(data: ResumeData, templateId: TemplateId) {
  const doc = await buildResumePdf(data, templateId);
  const base = (data.fullName || "resume").trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "resume";
  doc.save(`${base}-resume.pdf`);
}
