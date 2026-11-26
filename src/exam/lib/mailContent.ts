// Browser-safe email renderer. Text and recipient values are escaped before formatting.
import { resolveMailImageUrl } from './mailImages';
export const EMAIL_PALETTE = {
  primary: 'royalblue', success: 'seagreen', danger: 'firebrick', warning: 'darkorange', purple: 'darkorchid', teal: 'teal', pink: 'deeppink',
  highlight: 'lemonchiffon', info: 'aliceblue', neutral: 'whitesmoke', mint: '#d3f9d8', peach: '#ffe8cc', rose: '#ffe3e3', lavender: '#e5dbff', sky: '#d0ebff',
};
export const MAIL_TEXT_COLORS: (keyof typeof EMAIL_PALETTE)[] = ['primary', 'success', 'danger', 'warning', 'purple', 'teal', 'pink'];
export const MAIL_HIGHLIGHTS: (keyof typeof EMAIL_PALETTE)[] = ['highlight', 'info', 'neutral', 'mint', 'peach', 'rose', 'lavender', 'sky'];
const TONE = Object.keys(EMAIL_PALETTE).join('|');
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const timeVars = /\{\{\s*(examStart|examDate|examTime|examEnd|scheduleLine)\s*\}\}/;

export function prepareMailBody(body: string, vars: Record<string, string>) {
  // Remove whole schedule sentences/lines when there is no actual configured start.
  let content = body.split('\n').filter(line => vars.examStart || !timeVars.test(line)).join('\n');
  if (vars.examStart && !timeVars.test(content)) content += '\n\n{{scheduleLine}}';
  return content.replace(/\n{3,}/g, '\n\n').trim();
}

export const DEFAULT_SITE_URL = String((import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_SITE_URL || 'https://jobportalfree.pages.dev').replace(/\/+$/, '');
const siteUrl = () => (typeof window !== 'undefined' && window.location?.origin?.startsWith('http') ? window.location.origin : DEFAULT_SITE_URL);

export function renderMail(body: string, rawVars: Record<string, string>, includeSchedule = true) {
  const vars: Record<string, string> = { siteUrl: siteUrl(), ...rawVars };
  const imageBody = body.replace(/!\[([^\]\n]*)\]\(([^\s)]+)\)/g, '[image=$2]$1[/image]');
  const prepared = (includeSchedule ? prepareMailBody(imageBody, vars) : imageBody).replace(/\[image=([^\]\s]+)\]/g, (tag, address: string) => {
    const resolved = resolveMailImageUrl(address.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => vars[key] || ''));
    return resolved ? `[image=${resolved}]` : tag;
  });
  const substitute = (s: string, escaped: boolean) => s.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => escaped ? escapeHtml(vars[key] || '') : vars[key] || '');
  const text = substitute(prepared, false).replace(/\[link=([^\]\s]+)\]([\s\S]*?)\[\/link\]/g, '$2 ($1)').replace(/\[\/?(?:color|highlight)(?:=\w+)?\]/g, '').replace(/\[\/?(?:underline|italic|strike)\]/g, '').replace(/\[button=([^\]\s]+)\]([\s\S]*?)\[\/button\]/g, '$2: $1').replace(/\*\*(.*?)\*\*/g, '$1').replace(/\[image=[^\]\s]+\]([\s\S]*?)\[\/image\]/g, '$1');
  let html = substitute(escapeHtml(prepared), true).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\[underline\]([\s\S]*?)\[\/underline\]/g, '<u>$1</u>').replace(/\[italic\]([\s\S]*?)\[\/italic\]/g, '<em>$1</em>').replace(/\[strike\]([\s\S]*?)\[\/strike\]/g, '<s>$1</s>');
  html = html.replace(new RegExp(`\\[(color|highlight)=(${TONE})\\]([\\s\\S]*?)\\[\\/\\1\\]`, 'g'),
    (_, kind, tone: keyof typeof EMAIL_PALETTE, value) => `<span style="${kind === 'color' ? 'color' : 'background-color'}:${EMAIL_PALETTE[tone]};${kind === 'highlight' ? 'padding:2px 4px;' : ''}">${value}</span>`);
  // Links: only http(s)/mailto targets; values are already HTML-escaped above.
  html = html.replace(/\[link=((?:https?:\/\/|mailto:)[^\]\s]+)\]([\s\S]*?)\[\/link\]/g,
    (_, url, label) => `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:${EMAIL_PALETTE.primary};font-weight:600;text-decoration:underline">${label || url}</a>`);
  html = html.replace(/\[button=((?:https?:\/\/|mailto:)[^\]\s]+)\]([\s\S]*?)\[\/button\]/g,
    (_, url, label) => `<a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:${EMAIL_PALETTE.primary};color:white;padding:10px 18px;border-radius:8px;font-weight:600;text-decoration:none">${label || 'Open'}</a>`);
  // Pictures: only https images (logos, banners). Values are already HTML-escaped above.
  html = html.replace(/\[image=(https:\/\/[^\]\s]+)\]([\s\S]*?)\[\/image\]/g,
    (_, url, alt) => `<img src="${url}" alt="${alt.replace(/<[^>]*>/g, '')}" width="552" style="display:block;width:100%;max-width:${url.includes('mail-logo.png') ? '160px' : '552px'};height:auto;border:0;border-radius:8px;margin:8px auto">`);
  let inList = false;
  const lines: string[] = [];
  for (const line of html.split('\n')) {
    if (/^\s*[-•]\s+/.test(line)) {
      if (!inList) lines.push('<ul style="margin:12px 0;padding-left:24px">');
      inList = true;
      lines.push(`<li style="margin:6px 0">${line.replace(/^\s*[-•]\s+/, '')}</li>`);
    } else {
      if (inList) lines.push('</ul>');
      inList = false;
      lines.push(line ? `<div>${line}</div>` : '<div style="height:14px"></div>');
    }
  }
  if (inList) lines.push('</ul>');
  return { text, html: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:white;color:#202124;font-family:Arial,sans-serif"><div style="max-width:600px;margin:auto;padding:24px;font-size:15px;line-height:1.65;overflow-wrap:anywhere">${lines.join('')}</div></body></html>` };
}

export function scheduledExamVars(startValue?: string | null, offsetMinutes = 330, duration = 0) {
  const start = startValue ? new Date(startValue) : null;
  if (!start || !Number.isFinite(start.getTime())) return { examStart: '', examEnd: '', examDate: '', examTime: '', scheduleLine: '' };
  const options = { timeZone: 'UTC' };
  const local = new Date(start.getTime() + offsetMinutes * 60000);
  const examDate = local.toLocaleDateString('en-GB', { ...options, day: 'numeric', month: 'short', year: 'numeric' });
  const examTime = local.toLocaleTimeString('en-US', { ...options, hour: 'numeric', minute: '2-digit' });
  const zone = `UTC${offsetMinutes < 0 ? '-' : '+'}${String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, '0')}:${String(Math.abs(offsetMinutes) % 60).padStart(2, '0')}`;
  const examStart = `${examDate}, ${examTime} (${zone})`;
  const end = duration > 0 ? new Date(local.getTime() + duration * 60000).toLocaleString('en-GB', { ...options, day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
  return { examStart, examEnd: end ? `${end} (${zone})` : '', examDate, examTime, scheduleLine: `Exam date: ${examDate} · Start time: ${examTime} (${zone})` };
}