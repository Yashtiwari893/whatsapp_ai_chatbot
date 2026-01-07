export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import Tesseract from 'tesseract.js';
import { supabase } from '@/lib/supabaseClient';

// Groq client (OpenAI-compatible)
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

    // 1️⃣ OCR (FREE)
    const ocrResult = await Tesseract.recognize(
      image_url,
      'eng',
      {
        logger: () => {} // silent
      }
    );

    const ocrText = ocrResult.data.text?.trim();

    if (!ocrText) {
      return NextResponse.json(
        { error: 'No text detected from image' },
        { status: 400 }
      );
    }

    // 2️⃣ LLM Processing (Groq)
    const response = await openai.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        {
          role: 'user',
          content: `
Extract contact information from the following business card text.

Return ONLY valid JSON with these keys:
full_name, email, phone, designation, company_name, website.
If any field is missing, use null.

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

    // 3️⃣ Save to Supabase (UNCHANGED)
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

    // 4️⃣ Response
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
