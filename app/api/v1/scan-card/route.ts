import { NextResponse } from "next/server";

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
        {
          status: "error",
          message: "Unauthorized request",
        },
        { status: 401 }
      );
    }

    /* -----------------------------
       2. PARSE REQUEST BODY
    ------------------------------*/
    const body = await req.json();

    const { user_id, image_url } = body;

    /* -----------------------------
       3. BASIC VALIDATION
    ------------------------------*/
    if (!user_id || !image_url) {
      return NextResponse.json(
        {
          status: "error",
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    /* -----------------------------
       4. TEMP RESPONSE (TEST ONLY)
       AI LOGIC NEXT STEP ME AAYEGA
    ------------------------------*/
    return NextResponse.json({
      status: "success",
      data: {
        name: "Test User",
        company: "Demo Company",
        phone: "+91XXXXXXXXXX",
        email: "test@example.com",
      },
      confidence: {
        overall: 0.99,
      },
      missing_fields: [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}
