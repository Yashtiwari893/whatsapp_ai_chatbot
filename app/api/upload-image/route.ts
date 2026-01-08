import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { image_url } = await req.json();

  if (!image_url) {
    return NextResponse.json({ error: 'Image URL required' }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    image_url,
  });
}
