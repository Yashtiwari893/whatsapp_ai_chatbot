export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  const { whatsapp } = await req.json();

  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('whatsapp', whatsapp)
    .single();

  if (data) {
    return NextResponse.json({
      status: 'EXISTING',
      name: data.name,
    });
  }

  return NextResponse.json({ status: 'NEW' });
}
