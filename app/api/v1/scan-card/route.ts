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
    const { image_url, phone } = await req.json();

    if (!image_url || image_url.includes('{{')) {
      return NextResponse.json({ status: 'error', message: 'Send a real image' }, { status: 400 });
    }

    // Try multiple stable models
    const models = ["llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview"];
    let chatCompletion = null;
    let errorMsg = "";

    for (const modelId of models) {
      try {
        chatCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Extract JSON: name, email, phone, company." },
                { type: "image_url", image_url: { url: image_url } }
              ]
            }
          ],
          model: modelId,
          response_format: { type: "json_object" }
        });
        if (chatCompletion) break;
      } catch (e: any) {
        errorMsg = e.message;
        continue;
      }
    }

    if (!chatCompletion) throw new Error("Groq Free Limit Reached. Error: " + errorMsg);

    const cardData = JSON.parse(chatCompletion.choices[0].message.content || "{}");

    // Supabase Save
    await supabase.from('contacts').insert([{ 
      sender_phone: phone, 
      full_name: cardData.name, 
      email: cardData.email,
      company_name: cardData.company
    }]);

    return NextResponse.json({ status: 'success', data: cardData });

  } catch (error: any) {
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
  }
}