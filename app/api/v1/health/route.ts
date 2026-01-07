import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "11za-ai-backend",
    timestamp: new Date().toISOString(),
  });
}
