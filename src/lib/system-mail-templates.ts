// Browser-safe defaults for admin-editable system emails (stored in codexam_settings "system_mail_templates").
export type SystemTemplate = { subject: string; body: string };
export const SYSTEM_TEMPLATES_KEY = "system_mail_templates";
export const SYSTEM_TEMPLATES: Record<"verify_email" | "admin_alert" | "admin_approval", SystemTemplate & { label: string; vars: string[] }> = {
  verify_email: {
    label: "Verify email (new sign-ups)",
    vars: ["email", "link"],
    subject: "Verify your JobPortalFree email",
    body: "Hi {{email}},\n\nWelcome to **JobPortalFree**! Please confirm this email address to activate your account.\n\n[button={{link}}]Verify my email[/button]\n\nIf the button does not work, copy and open this link:\n[link={{link}}]{{link}}[/link]\n\nThis link is for {{email}} only. If you did not sign up, you can ignore this email.\n\n— Team JobPortalFree",
  },
  admin_alert: {
    label: "Admin alert emails",
    vars: ["brand", "who", "action", "name", "email", "details", "time", "link"],
    subject: "{{brand}}: {{who}} {{action}}",
    body: "Hi Admin,\n\n**{{who}}** {{action}}.\n\n- Name: {{name}}\n- Email: {{email}}\n- Details: {{details}}\n- Time: {{time}}\n\nPlease check here: {{link}}\n\n{{brand}} notifications",
  },
  admin_approval: {
    label: "Admin sign-in approval email",
    vars: ["account", "time", "device", "approvalUrl"],
    subject: "Approve admin sign-in — JobPortalFree",
    body: "**Admin sign-in approval**\n\nAccount: {{account}}\nDevice: {{device}}\nRequested: {{time}}\n\n[button={{approvalUrl}}]Review sign-in[/button]\n\nThis request expires in 15 minutes. You can also approve it from Admin Panel → Admin Controls. Ignoring it keeps access blocked.",
  },
};
export function resolveTemplate(saved: any, id: keyof typeof SYSTEM_TEMPLATES): SystemTemplate {
  const d = SYSTEM_TEMPLATES[id]; const s = saved?.[id] || {};
  return { subject: (s.subject || "").trim() || d.subject, body: (s.body || "").trim() || d.body };
}
