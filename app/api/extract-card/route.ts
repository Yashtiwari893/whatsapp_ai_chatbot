import { NextResponse } from 'next/server';
import { extractTextFromImage } from '@/lib/ocr';
import { structureText } from '@/lib/ai';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    const { image_url } = await req.json();

    if (!image_url) {
      return NextResponse.json({ error: 'Image URL required' }, { status: 400 });
    }

    const rawText = await extractTextFromImage(image_url);

    if (!rawText) {
      return NextResponse.json({ error: 'Image unreadable' }, { status: 400 });
    }

    const extracted = await structureText(rawText);

    const { data, error } = await supabase
      .from('business_cards')
      .insert([
        {
          ...extracted,
          image_url,
          raw_text: rawText,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: err.message,
    }, { status: 500 });
  }
}
