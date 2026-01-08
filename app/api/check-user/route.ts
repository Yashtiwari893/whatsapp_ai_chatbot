export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  const body = await req.json();
  const whatsapp = String(body.whatsapp || '').trim(); // 🔥 NORMALIZE

  if (!whatsapp) {
    return NextResponse.json({ status: 'NEW' });
  }

  const { data } = await supabase
    .from('users')
    .select('name')
    .eq('whatsapp', whatsapp)
    .maybeSingle();   // 🔥 SAFER THAN single()

  if (data) {
    return NextResponse.json({
      status: 'EXISTING',
      name: data.name,
    });
  }

  return NextResponse.json({ status: 'NEW' });
}
