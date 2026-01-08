export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { supabase } from '@/lib/supabase';
export async function POST(req: Request) {
  const { whatsapp, name, email } = await req.json();

  await supabase.from('users').insert([{ whatsapp, name, email }]);

  return Response.json({ success: true });
}
