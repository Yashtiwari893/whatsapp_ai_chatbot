export async function extractTextFromImage(imageUrl: string) {
  // 1️⃣ Download image on YOUR server
  const imageRes = await fetch(imageUrl);

  if (!imageRes.ok) {
    throw new Error('Failed to download image');
  }

  const imageBuffer = Buffer.from(await imageRes.arrayBuffer());

  // 2️⃣ Prepare multipart form-data
  const formData = new FormData();
  formData.append(
    'file',
    new Blob([imageBuffer]),
    'card.jpg'
  );
  formData.append('language', 'eng');
  formData.append('detectOrientation', 'true');
  formData.append('scale', 'true');
  formData.append('OCREngine', '2');

  // 3️⃣ Send file to OCR.space
  const ocrRes = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: {
      apikey: process.env.OCR_SPACE_API_KEY || 'helloworld',
    },
    body: formData,
  });

  if (!ocrRes.ok) {
    throw new Error('OCR request failed');
  }

  const data = await ocrRes.json();
  console.log('OCR RAW RESPONSE:', JSON.stringify(data, null, 2));

  if (data.IsErroredOnProcessing) {
    throw new Error(data.ErrorMessage?.[0] || 'OCR failed');
  }

  const text = data?.ParsedResults?.[0]?.ParsedText?.trim();

  if (!text) {
    throw new Error('No text detected');
  }

  return text;
}
