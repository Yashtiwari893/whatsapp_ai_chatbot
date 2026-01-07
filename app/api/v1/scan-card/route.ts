import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Groq } from 'groq-sdk';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image_url, phone } = body;

    // 1. Validation: Agar placeholder hai toh error return karo
    if (!image_url || image_url.includes('{{')) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Invalid Image URL. Please send a real image.' 
      }, { status: 400 });
    }

    // 2. Groq AI Processing
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Act as an OCR. Extract Name, Email, Phone, and Company from this card. Return ONLY a valid JSON object." },
            { type: "image_url", image_url: { url: image_url } }
          ]
        }
      ],
      model: "llama-3.2-11b-vision-preview",
      temperature: 0.1, // Kam temperature for high accuracy
      response_format: { type: "json_object" }
    });

    const content = chatCompletion.choices[0].message.content;
    if (!content) throw new Error("AI returned empty content");
    
    const cardData = JSON.parse(content);

    // 3. Save to Supabase
    const { error: dbError } = await supabase.from('contacts').insert([
      { 
        sender_phone: phone, 
        full_name: cardData.name || cardData.Name, 
        email: cardData.email || cardData.Email, 
        company_name: cardData.company || cardData.Company 
      }
    ]);

    if (dbError) console.error("Database Error:", dbError);

    return NextResponse.json({ status: 'success', data: cardData });

  } catch (error: any) {
    console.error("Critical Error:", error);
    // Exact error message return karo debugging ke liye
    return NextResponse.json({ 
      status: 'error', 
      message: error.message || "Something went wrong" 
    }, { status: 500 });
  }
}