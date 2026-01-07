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

    // 1. Validation
    if (!image_url || image_url.includes('{{')) {
      return NextResponse.json({ 
        status: 'error', 
        message: 'Invalid Image URL. Please send a real image.' 
      }, { status: 400 });
    }

    // 2. Groq AI Processing - ACTIVE MODEL (Jan 2026)
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extract Name, Email, Phone, and Company from this business card image. Return ONLY a valid JSON object with these exact keys: name, email, phone, company" },
            { type: "image_url", image_url: { url: image_url } }
          ]
        }
      ],
      // ✅ CURRENTLY ACTIVE VISION MODEL
      model: "llava-v1.5-7b-4096-preview",
      temperature: 0.1,
      max_tokens: 1024
      // Note: LLaVA doesn't support response_format json_object, so we'll parse manually
    });

    const content = chatCompletion.choices[0].message.content;
    if (!content) throw new Error("AI returned empty content");
    
    // Try to parse JSON from response (LLaVA might return text with JSON)
    let cardData;
    try {
      // If wrapped in markdown code blocks, extract JSON
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                       content.match(/(\{[\s\S]*\})/);
      cardData = JSON.parse(jsonMatch ? jsonMatch[1] : content);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      return NextResponse.json({ 
        status: 'error', 
        message: 'Failed to parse AI response',
        raw_response: content 
      }, { status: 500 });
    }

    // 3. Save to Supabase
    const { error: dbError } = await supabase.from('contacts').insert([
      { 
        sender_phone: phone, 
        full_name: cardData.name || cardData.Name || null, 
        email: cardData.email || cardData.Email || null, 
        company_name: cardData.company || cardData.Company || null,
        phone_number: cardData.phone || cardData.Phone || null
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