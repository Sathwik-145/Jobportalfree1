import { computeDoneSet } from "@/lib/exam-reminder-done";
import { getSetting, putSetting, sendGenericMails } from "@/lib/credential-mailer.server";

/** Sends "your exam window closes soon" mails before start + buffer. Called on every scheduler ping. */
export async function runExamReminders(db: any) {
  const cfg = await getSetting<any>(db, "exam_reminders", null);
  if (!cfg?.enabled) return { ran: false, reason: "reminders off" };
  const slots = await getSetting<Record<string, Record<string, { start: string | null; buffer: number }>>>(db, "student_exam_slots", {});
  const sentMap = await getSetting<Record<string, number>>(db, "exam_reminder_sent", {});
  const now = Date.now();
  const offsetTz = Number(cfg.tzOffsetMinutes ?? 330);
  let allowed: Set<string> | null = cfg.recipients === "selected" ? new Set<string>(cfg.studentIds || []) : null;
  if (cfg.recipients === "group") {
    const groups = await getSetting<{ id: string; members: string[] }[]>(db, "exam_reminder_groups", []);
    const ids = new Set<string>(cfg.groupIds || []);
    allowed = new Set<string>((groups || []).filter((g) => ids.has(g.id)).flatMap((g) => g.members || []));
  }
  const due: { sid: string; exId: string; left: number; deadline: number; keys: string[] }[] = [];
  for (const [sid, perExam] of Object.entries(slots || {})) {
    if (allowed && !allowed.has(sid)) continue;
    for (const [exId, slot] of Object.entries(perExam || {})) {
      if (!slot?.start) continue;
      const deadline = new Date(slot.start).getTime() + Number(slot.buffer ?? 10) * 60000;
      const left = (deadline - now) / 60000;
      if (!(left > 0)) continue;
      const buffer = Number(slot.buffer ?? 10);
      const offs = new Set<number>((cfg.offsets || []).map(Number).filter((n: number) => n > 0));
      if (cfg.every5) for (let m = 5; m <= Math.max(5, buffer); m += 5) offs.add(m);
      const keys = [...offs].filter((o) => left <= o && !sentMap[`${sid}|${exId}|${slot.start}|${o}`]).map((o) => `${sid}|${exId}|${slot.start}|${o}`);
      if (keys.length) due.push({ sid, exId, left, deadline, keys });
    }
  }
  if (!due.length) return { ran: false, reason: "nothing due" };

  // Skip students who already submitted that test (MCQ, writing, FIB or coding).
  const sids = [...new Set(due.map((d) => d.sid))];
  const { data: exams } = await db.from("exams").select("id,title,question_ids").in("id", [...new Set(due.map((d) => d.exId))]);
  const examRows: any[] = [];
  for (const t of ["mcq_submissions", "writing_submissions", "fib_submissions"]) {
    try { const { data } = await db.from(t).select("student_id,exam_id").in("student_id", sids); examRows.push(...(data || [])); } catch {}
  }
  let codingRows: any[] = [];
  try { const { data } = await db.from("submissions").select("student_id,question_id").in("student_id", sids); codingRows = data || []; } catch {}
  const done = computeDoneSet({ examRows, codingRows, exams: exams || [] });
  const contacts = await getSetting<Record<string, string>>(db, "student_contacts", {});
  const { data: students } = await db.from("students").select("id,name,email").in("id", sids);
  const fmt = (t: number) => new Date(t + offsetTz * 60000).toISOString().slice(11, 16);
  let sent = 0;
  for (const d of due) {
    if (done.has(`${d.sid}|${d.exId}`)) { for (const k of d.keys) sentMap[k] = now; continue; }
    const st = (students || []).find((s: any) => s.id === d.sid);
    const email = cfg.mailTarget === "login" ? st?.email : contacts[d.sid] || st?.email;
    if (!st || !email) continue;
    const title = (exams || []).find((e: any) => e.id === d.exId)?.title || "your exam";
    try {
      const r = await sendGenericMails({
        db, recipients: [{ name: st.name, email }], subject: cfg.subject || "{{examTitle}} closes in {{minutesLeft}} minutes",
        body: cfg.body || "Hi {{name}},\n\nYour exam {{examTitle}} will close in {{minutesLeft}} minutes (at {{deadline}}). Please start now.\n\nAll the best!",
        source: "exam-reminder", senderName: cfg.senderName || "",
        vars: { examTitle: title, minutesLeft: String(Math.max(1, Math.round(d.left))), deadline: fmt(d.deadline) },
      });
      sent += r.sent;
      if (r.sent) for (const k of d.keys) sentMap[k] = now;
    } catch (e) { console.error("exam reminder failed", d.sid, d.exId, e); }
  }
  // keep the bookkeeping small
  const trimmed = Object.fromEntries(Object.entries(sentMap).filter(([, t]) => now - t < 3 * 86400000));
  await putSetting(db, "exam_reminder_sent", trimmed);
  return { ran: true, sent };
}
