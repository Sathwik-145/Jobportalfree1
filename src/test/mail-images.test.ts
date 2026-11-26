import { describe, expect, it } from 'vitest';
import { MAIL_IMAGES, resolveMailImageUrl } from '@/exam/lib/mailImages';
import { renderMail } from '@/exam/lib/mailContent';

describe('public email picture addresses', () => {
  it('offers twelve reusable images including logo and welcome', () => {
    expect(MAIL_IMAGES.map(image => image.id)).toEqual(['logo', 'welcome-logo', 'welcome', 'assessment', 'interview', 'success', 'certificate', 'celebration', 'reminder', 'deadline', 'tips', 'thankyou']);
    expect(new Set(MAIL_IMAGES.map(image => image.url)).size).toBe(12);
    for (const image of MAIL_IMAGES) expect(resolveMailImageUrl(image.url)).toBe(image.url);
  });
  it('repairs existing built-in picture links independently of sending host', () => {
    expect(resolveMailImageUrl('{{siteUrl}}/email/logo.png')).toBe(MAIL_IMAGES[0].url);
    expect(resolveMailImageUrl('http://localhost:8080/email/welcome.jpg')).toBe(MAIL_IMAGES.find(i => i.id === 'welcome')!.url);
    expect(resolveMailImageUrl('https://jobportalfree.vercel.app/email/assessment.jpg')).toBe(MAIL_IMAGES.find(i => i.id === 'assessment')!.url);
  });
  it('rejects unsafe or private picture addresses', () => {
    for (const url of ['javascript:alert(1)', 'data:image/png;base64,abc', 'http://example.com/a.jpg', 'https://localhost/a.jpg', 'https://user:pass@example.com/a.jpg', '/private.jpg']) expect(resolveMailImageUrl(url)).toBeNull();
  });
  it('retains public HTTPS links including query parameters', () => {
    expect(resolveMailImageUrl(' https://example.com/a.jpg?size=600&format=jpg ')).toBe('https://example.com/a.jpg?size=600&format=jpg');
  });
  it('supports markdown images in plain email content without image syntax', () => {
    expect(renderMail('![Welcome](https://example.com/welcome.jpg)\nHello {{name}}', { name: 'Student' }, false).text).toBe('Welcome\nHello Student');
  });
});