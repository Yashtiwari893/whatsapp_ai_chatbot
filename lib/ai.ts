import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || '',
  baseURL: 'https://api.groq.com/openai/v1',
});

/* ---------- HARDENED JSON PARSER ---------- */
function safeJsonParse(raw: string) {
  try {
    const cleaned = raw
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .replace(/[\u0000-\u001F]+/g, '') // remove hidden control chars
      .trim();

    return JSON.parse(cleaned);
  } catch (err) {
    console.error('❌ JSON parse failed. Raw:', raw);
    return null;
  }
}

/* ---------- FINAL STRONG VERSION ---------- */
export async function structureText(text: string) {
  try {
    if (!process.env.GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY missing');
      return {};
    }

    if (!text || text.trim().length < 15) {
      console.error('❌ OCR text too short or empty');
      return {};
    }

    // ✂️ Token safety (Groq limit guard)
    const SAFE_TEXT = text.substring(0, 4000);

    const res = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      temperature: 0,
      max_tokens: 350,
      messages: [
        {
          role: 'system',
          content:
            'You are a data extraction engine. Return clean JSON only. No markdown. No explanation.',
        },
        {
          role: 'user',
          content: `
Extract business card data.

Return ONLY valid JSON.
No markdown. No explanation.

Required keys:
full_name,
email,
phone,
designation,
company_name,
website,
address,
category,
linkedin

Text:
${SAFE_TEXT}
`,
        },
      ],
    });

    const raw = res.choices?.[0]?.message?.content;

    if (!raw) {
      console.error('❌ Empty LLM output');
      return {};
    }

    const parsed = safeJsonParse(raw);
    if (!parsed) return {};

    // 🧹 Clean & normalize
    return {
      full_name: parsed.full_name || null,
      email: parsed.email || null,
      phone: parsed.phone || null,
      designation: parsed.designation || null,
      company_name: parsed.company_name || null,
      website: parsed.website || null,
      address: parsed.address || null,
      category: parsed.category || null,
      linkedin: parsed.linkedin || null,
    };
  } catch (err: any) {
    console.error('🔥 Groq fatal error:', err?.message || err);
    return {};
  }
}
