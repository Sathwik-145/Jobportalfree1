import { supabase } from '@/lib/db-client';

export async function mailRequestHeaders() {
  const { data } = await supabase.auth.getSession();
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session?.access_token || ''}` };
}