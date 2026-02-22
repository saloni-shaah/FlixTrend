
import { NextResponse } from 'next/server';

export async function GET() {
  const giphyApiKey = process.env.GIPHY_API_KEY;

  if (!giphyApiKey) {
    return NextResponse.json({ error: 'Giphy API key not configured' }, { status: 500 });
  }

  return NextResponse.json({ apiKey: giphyApiKey });
}
