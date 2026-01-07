import { NextResponse } from "next/server";
import OpenAI from "openai";

/**
 * POST /api/v1/scan-card
 * 11za → Backend (processing only)
 */
export async function POST(req: Request) {
  try {
    /* -----------------------------
       1. AUTH & ORIGIN VALIDATION
    ------------------------------*/
    const origin = req.headers.get("origin");
    const authHeader = req.headers.get("authorization");

    if (
      origin !== process.env.WHATSAPP_11ZA_ORIGIN ||
      authHeader !== `Bearer ${process.env.WHATSAPP_11ZA_AUTH_TOKEN}`
    ) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized request" },
        { status: 401 }
      );
    }

    /* -----------------------------
       2. PARSE REQUEST BODY
    ------------------------------*/
    const body = await req.json();
    const { user_id, image_url } = body;

    if (!user_id || !image_url) {
      return NextResponse.json(
        { status: "error", message: "Missing required fields" },
        { status: 400 }
      );
    }

    /* -----------------------------
       3. INIT OPENAI CLIENT
    ------------------------------*/
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    /* -----------------------------
       4. OCR USING OPENAI VISION
    ------------------------------*/
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Extract ALL readable text from the business card image. Return plain text only.",
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: image_url },
            },
          ],
        },
      ],
    });

    const rawText =
      visionResponse.choices[0]?.message?.content?.trim();

    if (!rawText) {
      return NextResponse.json(
        { status: "error", message: "OCR failed" },
        { status: 400 }
      );
    }

    /* -----------------------------
       5. PARSE TEXT → STRUCTURED DATA
    ------------------------------*/
    const parseResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a data extraction engine.
From the given text, extract business card details.

Return ONLY valid JSON in this format:
{
  "name": string | null,
  "designation": string | null,
  "company": string | null,
  "phone": string | null,
  "email": string | null,
  "website": string | null
}

Rules:
- Do not guess.
- If not present, return null.
- No extra text.
          `,
        },
        {
          role: "user",
          content: rawText,
        },
      ],
    });

    const parsedText =
      parseResponse.choices[0]?.message?.content;

    let data;
    try {
      data = JSON.parse(parsedText || "{}");
    } catch {
      return NextResponse.json(
        { status: "error", message: "Parsing failed" },
        { status: 500 }
      );
    }

    /* -----------------------------
       6. DETERMINE MISSING FIELDS
    ------------------------------*/
    const requiredFields = ["name", "phone", "email"];
    const missingFields = requiredFields.filter(
      (field) => !data[field]
    );

    /* -----------------------------
       7. CONFIDENCE SCORE (SIMPLE)
    ------------------------------*/
    const filledCount =
      requiredFields.length - missingFields.length;
    const confidence = Number(
      (filledCount / requiredFields.length).toFixed(2)
    );

    /* -----------------------------
       8. FINAL RESPONSE FOR 11za
    ------------------------------*/
    if (missingFields.length === 0) {
      return NextResponse.json({
        status: "success",
        data,
        confidence: { overall: confidence },
        missing_fields: [],
      });
    }

    return NextResponse.json({
      status: "partial",
      data,
      confidence: { overall: confidence },
      missing_fields: missingFields,
    });
  } catch (error) {
    console.error("SCAN CARD ERROR:", error);

    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
