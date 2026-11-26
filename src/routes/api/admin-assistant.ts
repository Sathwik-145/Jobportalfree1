import { createFileRoute } from '@tanstack/react-router';
import { handleAdminAssistant } from '@/lib/admin-assistant.server';
export const Route = createFileRoute('/api/admin-assistant')({ server: { handlers: { POST: ({ request }) => handleAdminAssistant(request) } } });
