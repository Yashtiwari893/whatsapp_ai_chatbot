import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function structureText(text: string) {
  const res = await client.chat.completions.create({
    model: 'llama-3.1-8b-instant', // ✅ UPDATED MODEL
    temperature: 0,
    max_tokens: 300,
    messages: [
      {
        role: 'system',
        content: 'You extract structured data from OCR text and return valid JSON only.',
      },
      {
        role: 'user',
        content: `
Extract business card data.
Return ONLY valid JSON.

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

  const content = res.choices[0].message.content || '{}';

  try {
    return JSON.parse(content);
  } catch (err) {
    console.error('JSON parse failed:', content);
    return {};
  }
}
