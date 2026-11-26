export const ADMIN_EVENTS = {
  exam_started: { title: 'started a test', where: '/exam-admin/reports' },
  test_submitted: { title: 'submitted a test', where: '/exam-admin/reports' },
  registration: { title: 'registered for an assessment', where: '/exam-admin/registrations' },
  link_registration: { title: 'registered through a registration link', where: '/exam-admin/link-registrants' },
  quick_signup: { title: 'signed up through Quick Start', where: '/exam-admin/quick-registrations' },
  user_registered: { title: 'created a job portal account', where: '/admin/users' },
  user_login: { title: 'signed in to the job portal', where: '/admin/users' },
  job_application: { title: 'applied for a job', where: '/admin/applications' },
  user_message: { title: 'sent a message to the admin', where: '/admin/messages' },
  admin_login: { title: 'signed in to the admin panel', where: '/admin/controls' },
  reevaluation: { title: 'requested result reevaluation', where: '/exam-admin/reevaluations' },
} as const;
export type AdminEvent = keyof typeof ADMIN_EVENTS;
export const adminEventEnabled = (prefs: Record<string, boolean>, event: AdminEvent) => prefs.all !== false && prefs[event] !== false;