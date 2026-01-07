import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const origin = req.headers.get("origin");
  const authToken = req.headers.get("authorization");

  // Basic verification (sirf testing ke liye)
  if (
    origin !== process.env.WHATSAPP_11ZA_ORIGIN ||
    authToken !== `Bearer ${process.env.WHATSAPP_11ZA_AUTH_TOKEN}`
  ) {
    return NextResponse.json(
      {
        status: "unauthorized",
        message: "Invalid 11za request",
      },
      { status: 401 }
    );
  }

  return NextResponse.json({
    status: "ok",
    service: "11za-ai-backend",
    version: "v1",
    timestamp: new Date().toISOString(),
  });
}
