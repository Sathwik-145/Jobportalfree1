import { useEffect } from 'react';
import { useLocation } from '@/lib/router-compat';
import { defaultBranding, usePresentation } from '@/lib/portalPresentation';
export default function PortalBranding() {
  const { pathname } = useLocation();
  const exam = /^\/(exam(?:-|\/|$)|quick-start|apply\/)/.test(pathname);
  const branding = usePresentation(exam ? 'exam_branding' : 'job_branding', defaultBranding(exam));
  useEffect(() => {
    document.title = branding.title;
    let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!icon) { icon = document.createElement('link'); icon.rel = 'icon'; document.head.appendChild(icon); }
    icon.removeAttribute('type'); icon.href = branding.icon || '/favicon.png';
  }, [branding, pathname]);
  return null;
}
