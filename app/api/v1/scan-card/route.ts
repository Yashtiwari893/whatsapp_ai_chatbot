import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

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

    // 2. Fetch image and convert to base64
    const imageResponse = await fetch(image_url);
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image');
    }
    
    const buffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    
    // Detect mime type
    const mimeType = image_url.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';

    // 3. Gemini Vision Processing
    // ✅ FIXED: Use correct model name
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash-latest" // Changed from "gemini-1.5-flash"
    });

    const result = await model.generateContent([
      {
        text: `Extract the following information from this business card image and return ONLY a valid JSON object:
{
  "name": "full name",
  "email": "email address",
  "phone": "phone number",
  "company": "company name"
}
If any field is not found, use null. Return ONLY the JSON, no other text.`
      },
      {
        inlineData: {
          data: base64,
          mimeType: mimeType
        }
      }
    ]);

    const text = result.response.text();
    console.log("Gemini Raw Response:", text);

    // Parse JSON
    let cardData;
    try {
      const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                       text.match(/(\{[\s\S]*\})/);
      const jsonString = jsonMatch ? jsonMatch[1] : text;
      cardData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      return NextResponse.json({ 
        status: 'error', 
        message: 'Failed to parse AI response',
        raw_response: text 
      }, { status: 500 });
    }

    // 4. Save to Supabase
    const { error: dbError } = await supabase.from('contacts').insert([
      { 
        sender_phone: phone, 
        full_name: cardData.name || null, 
        email: cardData.email || null, 
        company_name: cardData.company || null,
        phone_number: cardData.phone || null
      }
    ]);

    if (dbError) {
      console.error("Database Error:", dbError);
    }

    return NextResponse.json({ status: 'success', data: cardData });

  } catch (error: any) {
    console.error("Critical Error:", error);
    return NextResponse.json({ 
      status: 'error', 
      message: error.message || "Something went wrong" 
    }, { status: 500 });
  }
}