export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Groq } from 'groq-sdk'; // npm install groq-sdk agar nahi kiya hai

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { image_url, phone } = await req.json();

    // Groq Llama-3 Vision ya Text-based Extraction
    // Note: Agar image_url se direct extraction chahiye toh 'llama-3.2-11b-vision-preview' use karein
    const chatCompletion = await groq.chat.completions.create({
      "messages": [
        {
          "role": "user",
          "content": [
            {
              "type": "text",
              "text": "Extract details from this business card image URL and return ONLY JSON: name, email, phone, company."
            },
            {
              "type": "image_url",
              "image_url": { "url": image_url }
            }
          ]
        }
      ],
      "model": "llama-3.2-11b-vision-preview", // Best for OCR & Vision tasks
      "response_format": { "type": "json_object" }
    });

    const cardData = JSON.parse(chatCompletion.choices[0].message.content || "{}");

    // Supabase Save Logic (Same as before)
    await supabase.from('contacts').insert([{ 
      sender_phone: phone, 
      full_name: cardData.name, 
      email: cardData.email,
      company_name: cardData.company
    }]);

    return NextResponse.json({ status: 'success', data: cardData });

  } catch (error: any) {
    console.error("Groq Error:", error.message);
    return NextResponse.json({ status: 'error', message: "AI Processing Failed" }, { status: 500 });
  }
}