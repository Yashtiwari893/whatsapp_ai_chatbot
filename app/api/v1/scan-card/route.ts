import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image_url, phone } = body;

    // 1. Validation
    if (!image_url || image_url.includes('{{')) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Invalid Image URL. Please send a real image.' 
      }, { status: 400 });
    }

    // 2. OpenAI Vision Processing
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // or "gpt-4-turbo" or "gpt-4o-mini" (cheaper)
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Extract Name, Email, Phone, and Company from this business card image. Return ONLY a valid JSON object with keys: name, email, phone, company" 
            },
            { 
              type: "image_url", 
              image_url: { url: image_url } 
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500
    });

    const content = response.choices[0].message.content;
    if (!content) throw new Error("AI returned empty content");
    
    const cardData = JSON.parse(content);

    // 3. Save to Supabase
    const { error: dbError } = await supabase.from('contacts').insert([
      { 
        sender_phone: phone, 
        full_name: cardData.name || null, 
        email: cardData.email || null, 
        company_name: cardData.company || null,
        phone_number: cardData.phone || null
      }
    ]);

    if (dbError) console.error("Database Error:", dbError);

    return NextResponse.json({ status: 'success', data: cardData });

  } catch (error: any) {
    console.error("Critical Error:", error);
    return NextResponse.json({ 
      status: 'error', 
      message: error.message || "Something went wrong" 
    }, { status: 500 });
  }
}