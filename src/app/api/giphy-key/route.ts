'use server';
import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.GIPHY_API_KEY;

  if (!apiKey) {
    return new NextResponse(JSON.stringify({ error: 'Giphy API key not found in environment variables.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return NextResponse.json({ apiKey });
}
