/**
 * Pages where a student is inside the CodeXam exam portal (sign-in, dashboard, instructions,
 * checks and the live test). Help chat / AI assistants must never appear on these pages.
 */
const EXAM_PAGE = /^\/(exam(?:-|\/|$)(?!admin)|start(?:\/|$)|quick-start|system-check|exam-permissions|apply\/|assessments\/test)/;

export function isExamPage(pathname: string): boolean {
  return EXAM_PAGE.test(pathname);
}

/** CodeXam admin pages (exam staff tools). */
export function isExamAdminPage(pathname: string): boolean {
  return /^\/exam-admin(?:\/|$)/.test(pathname);
}

/** Whether festival looks may show on this page, given the admin's exam-page switches. */
export function festivalAllowedOn(pathname: string, s: { examPages?: boolean; examAdminPages?: boolean }): boolean {
  if (isExamPage(pathname)) return s.examPages === true;
  if (isExamAdminPage(pathname)) return s.examAdminPages !== false;
  return true;
}
