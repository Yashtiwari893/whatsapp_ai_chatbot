import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image_url, phone } = body;

    if (!image_url) {
      return NextResponse.json({ status: 'error', message: 'No image provided' }, { status: 400 });
    }

    // 1. AI Extraction (OpenAI Vision)
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // Ya "gpt-4-vision-preview"
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extract contact details from this business card. Return ONLY a JSON object with: name, designation, email, phone, company, website." },
            { type: "image_url", image_url: { url: image_url } },
          ],
        },
      ],
      response_format: { type: "json_object" }
    });

    const cardData = JSON.parse(response.choices[0].message.content || "{}");

    // 2. Save to Supabase
    const { data: dbData, error: dbError } = await supabase
      .from('contacts')
      .insert([
        { 
          sender_phone: phone,
          full_name: cardData.name,
          designation: cardData.designation,
          email: cardData.email,
          company_name: cardData.company,
          image_url: image_url,
          raw_ai_response: cardData
        }
      ]);

    // 3. Optional: Trigger Google Sheet Webhook (Async)
    if (process.env.GOOGLE_SHEET_WEBHOOK) {
        fetch(process.env.GOOGLE_SHEET_WEBHOOK, {
            method: 'POST',
            body: JSON.stringify({ ...cardData, phone_sent_from: phone }),
        }).catch(err => console.log("Webhook Error:", err));
    }

    // 4. Return to 11za
    return NextResponse.json({
      status: 'success',
      data: cardData
    });

  } catch (error: any) {
    console.error("Processing Error:", error);
    return NextResponse.json({ 
      status: 'error', 
      message: error.message || 'Internal Server Error' 
    }, { status: 500 });
  }
}