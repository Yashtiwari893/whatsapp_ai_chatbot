export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabaseClient';

// Groq client
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function POST(req: Request) {
  try {
    const { image_url } = await req.json();

    if (!image_url) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // 1️⃣ OCR via OCR.space (Serverless safe)
    const ocrRes = await fetch('https://api.ocr.space/parse/imageurl', {
      method: 'POST',
      headers: {
        apikey: process.env.OCR_SPACE_API_KEY || 'helloworld',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        url: image_url,
        language: 'eng',
        isOverlayRequired: 'false',
      }),
    });

    const ocrData = await ocrRes.json();
    const ocrText =
      ocrData?.ParsedResults?.[0]?.ParsedText?.trim();

    if (!ocrText) {
      return NextResponse.json(
        { error: 'No text detected from image' },
        { status: 400 }
      );
    }

    // 2️⃣ Groq LLM
    const response = await openai.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'user',
          content: `
Extract contact information from the following business card text.

Return ONLY valid JSON with keys:
full_name, email, phone, designation, company_name, website.
Use null if missing.

TEXT:
${ocrText}
          `,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const extractedData = JSON.parse(
      response.choices[0].message.content || '{}'
    );

    // 3️⃣ Supabase (unchanged)
    const { data, error } = await supabase
      .from('business_cards')
      .insert([
        {
          ...extractedData,
          image_url,
          raw_ai_output: extractedData,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { success: true, data },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Extraction Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}
