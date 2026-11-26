export const ADMIN_APPROVAL_EMAIL = 'jobportalfreeofficial@gmail.com';
export const ADMIN_APPROVAL_KEY = 'admin_login_approval';
export const APPROVAL_LIFETIME_MS = 15 * 60 * 1000;
export type ApprovalStatus = 'disabled' | 'pending' | 'approved' | 'expired' | 'denied';
export function approvalAllowsAccess(enabled: boolean, status: ApprovalStatus) {
  return !enabled || status === 'approved';
}
export function approvalStatus(row: { status: string; expires_at: string } | null, now = Date.now()): ApprovalStatus {
  if (!row) return 'pending';
  if (row.status === 'approved') return 'approved';
  if (row.status === 'denied') return 'denied';
  return Date.parse(row.expires_at) <= now ? 'expired' : 'pending';
}