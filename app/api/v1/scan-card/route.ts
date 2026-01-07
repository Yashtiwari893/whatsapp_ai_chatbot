import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '@/lib/supabaseClient';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { image_url } = await req.json();

    if (!image_url) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    // 1. AI Vision Processing
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Extract contact information from this business card. Return ONLY a JSON object with these keys: full_name, email, phone, designation, company_name, website. If any field is missing, use null." 
            },
            {
              type: "image_url",
              image_url: { url: image_url },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
    });

    const extractedData = JSON.parse(response.choices[0].message.content || "{}");

    // 2. Save to Supabase
    const { data, error } = await supabase
      .from('business_cards')
      .insert([
        { 
          ...extractedData, 
          image_url, 
          raw_ai_output: extractedData 
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // 3. Return Structured Response
    return NextResponse.json({
      success: true,
      data: data
    }, { status: 200 });

  } catch (error: any) {
    console.error("Extraction Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Internal Server Error" 
    }, { status: 500 });
  }
}