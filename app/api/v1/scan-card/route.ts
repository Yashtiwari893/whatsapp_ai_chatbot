export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabaseClient';

// Groq client initialization
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function POST(req: Request) {
  try {
    const { image_url, phone } = await req.json(); // Added phone to capture sender

    if (!image_url) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    // 1️⃣ OCR via OCR.space (Processing image to text)
    const ocrRes = await fetch('https://api.ocr.space/parse/imageurl', {
      method: 'POST',
      headers: {
        apikey: process.env.OCR_SPACE_API_KEY || 'helloworld', // Use your key in Vercel
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        url: image_url,
        language: 'eng',
        isOverlayRequired: 'false',
        detectOrientation: 'true', // Added for better accuracy if card is sideways
      }),
    });

    const ocrData = await ocrRes.json();
    const ocrText = ocrData?.ParsedResults?.[0]?.ParsedText?.trim();

    if (!ocrText) {
      return NextResponse.json({ error: 'AI could not read text. Please send a clearer image.' }, { status: 400 });
    }

    // 2️⃣ Groq LLM (Structuring messy text into clean JSON)
    const response = await openai.chat.completions.create({
      model: 'llama3-8b-8192', // Stable and fast for free tier
      messages: [
        {
          role: 'user',
          content: `Extract business card details from this text. 
          Return ONLY valid JSON. Keys: full_name, email, phone, designation, company_name, website.
          Text: ${ocrText}`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const extractedData = JSON.parse(response.choices[0].message.content || '{}');

    // 3️⃣ Supabase (Saving data)
    const { data, error } = await supabase
      .from('business_cards')
      .insert([
        {
          ...extractedData,
          image_url,
          sender_phone: phone, // Saving who sent the card
          raw_ai_output: extractedData,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // 4️⃣ Return data formatted for 11za mapping
    return NextResponse.json({ 
      success: true, 
      status: "success", // Added for 11za consistency
      data: data 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Extraction Error:', error);
    return NextResponse.json({
      success: false,
      status: "error",
      message: error.message || 'Something went wrong',
    }, { status: 500 });
  }
}