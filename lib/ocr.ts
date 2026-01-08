export async function extractTextFromImage(imageUrl: string) {
  const res = await fetch('https://api.ocr.space/parse/imageurl', {
    method: 'POST',
    headers: {
      apikey: process.env.OCR_SPACE_API_KEY!,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      url: imageUrl,
      language: 'eng',
      OCREngine: '2',
    }),
  });

  const data = await res.json();
  return data?.ParsedResults?.[0]?.ParsedText || null;
}
