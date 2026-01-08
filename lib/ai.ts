import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || '',
  baseURL: 'https://api.groq.com/openai/v1',
});

// 🔒 JSON cleaner (IMPORTANT)
function safeJsonParse(raw: string) {
  try {
    const cleaned = raw
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    return JSON.parse(cleaned);
  } catch (err) {
    console.error('❌ JSON parse failed:', raw);
    return {};
  }
}

export async function structureText(text: string) {
  try {
    // 🛑 ENV CHECK (Vercel 500 ka main reason)
    if (!process.env.GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY is missing');
      return {};
    }

    if (!text || text.trim().length === 0) {
      console.error('❌ Empty OCR text received');
      return {};
    }

    const res = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant', // ✅ Free tier friendly
      temperature: 0,
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content:
            'You extract structured data from OCR text and return valid JSON only. No markdown. No explanation.',
        },
        {
          role: 'user',
          content: `
Extract business card data.
Return ONLY valid JSON.
No markdown. No explanation.

Fields:
full_name,
email,
phone,
designation,
company_name,
website

Text:
${text}
`,
        },
      ],
    });

    const content = res.choices?.[0]?.message?.content;

    if (!content) {
      console.error('❌ Empty response from Groq LLM');
      return {};
    }

    // ✅ SAFE JSON PARSE
    return safeJsonParse(content);
  } catch (err: any) {
    console.error('🔥 Groq LLM Error:', err?.message || err);
    return {};
  }
}
