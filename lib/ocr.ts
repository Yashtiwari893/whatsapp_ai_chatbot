export async function extractTextFromImage(imageUrl: string) {
  // 1️⃣ Download image
  const imageRes = await fetch(imageUrl);

  if (!imageRes.ok) {
    throw new Error('Image download failed');
  }

  const buffer = await imageRes.arrayBuffer();
  const base64Image = Buffer.from(buffer).toString('base64');

  // 2️⃣ Send base64 to OCR.space
  const ocrRes = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: {
      apikey: process.env.OCR_SPACE_API_KEY!,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      base64Image: `data:image/jpeg;base64,${base64Image}`,
      language: 'eng',
      OCREngine: '2',
      scale: 'true',
      detectOrientation: 'true',
    }),
  });

  const data = await ocrRes.json();

  const text = data?.ParsedResults?.[0]?.ParsedText?.trim();

  return text || null;
}
