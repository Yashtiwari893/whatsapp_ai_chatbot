import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function structureText(text: string) {
  const res = await client.chat.completions.create({
    model: 'llama3-8b-8192',
    temperature: 0,
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `
Extract business card data.
Return ONLY valid JSON.

Fields:
full_name, email, phone, designation, company_name, website.

Text:
${text}
`,
      },
    ],
  });

  return JSON.parse(res.choices[0].message.content || '{}');
}
