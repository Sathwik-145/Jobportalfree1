import { supabase } from "@/lib/db-client";

/** Saves camera/screen recordings in short segments so a closed tab loses at most one segment. */
export type RecordingOwner = { studentId: string; name?: string; email?: string; examTitle?: string };

const SEGMENT_MS = 2 * 60 * 1000;
const BUCKET = "exam-recordings";
type Kind = "camera" | "screen";

type Active = { kind: Kind; stream: MediaStream; recorder: MediaRecorder | null; timer: ReturnType<typeof setTimeout> | null; startedAt: number };
let active: Active[] = [];
let owner: RecordingOwner | null = null;

function pickType() {
  const types = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  return types.find(t => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t)) || "";
}

async function upload(kind: Kind, blob: Blob, startedAt: number, endedAt: number) {
  if (!owner || blob.size < 1000) return;
  const safeId = owner.studentId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  const path = `rec/${safeId}/${startedAt}-${kind}-${Math.random().toString(36).slice(2, 8)}.webm`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: "video/webm", upsert: false });
  if (error) { console.warn("Recording upload failed", error.message); return; }
  await supabase.from("exam_recordings").insert({
    student_id: owner.studentId, student_name: owner.name ?? null, student_email: owner.email ?? null,
    exam_title: owner.examTitle ?? null, kind, path, size_bytes: blob.size,
    started_at: new Date(startedAt).toISOString(), ended_at: new Date(endedAt).toISOString(),
  });
}

function startSegment(a: Active) {
  const live = a.stream.getTracks().some(t => t.readyState === "live");
  if (!live) return;
  const mimeType = pickType();
  let rec: MediaRecorder;
  try { rec = new MediaRecorder(a.stream, mimeType ? { mimeType, videoBitsPerSecond: 600_000 } : undefined); }
  catch { return; }
  const chunks: Blob[] = [];
  const startedAt = Date.now();
  rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
  rec.onstop = () => { void upload(a.kind, new Blob(chunks, { type: "video/webm" }), startedAt, Date.now()); };
  rec.start(10_000);
  a.recorder = rec; a.startedAt = startedAt;
  a.timer = setTimeout(() => {
    if (!active.includes(a)) return;
    try { rec.stop(); } catch { /* already stopped */ }
    startSegment(a);
  }, SEGMENT_MS);
}

export function startRecording(who: RecordingOwner, streams: { camMic: MediaStream | null; screen: MediaStream | null }) {
  stopRecording();
  if (typeof MediaRecorder === "undefined") return;
  owner = who;
  const list: [Kind, MediaStream | null][] = [["camera", streams.camMic], ["screen", streams.screen]];
  for (const [kind, stream] of list) {
    if (!stream) continue;
    const a: Active = { kind, stream, recorder: null, timer: null, startedAt: Date.now() };
    active.push(a);
    startSegment(a);
  }
}

/** Stops every recorder; the last segment still uploads in the background. */
export function stopRecording() {
  const current = active;
  active = [];
  current.forEach(a => {
    if (a.timer) clearTimeout(a.timer);
    try { if (a.recorder && a.recorder.state !== "inactive") { a.recorder.requestData(); a.recorder.stop(); } } catch { /* ignore */ }
  });
}

export const isRecording = () => active.length > 0;
