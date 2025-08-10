import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const client_id = process.env.SPOTIFY_CLIENT_ID!;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET!;
  const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basic}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return NextResponse.json({ error: data.error || 'Token fetch failed' }, { status: 400 });
  }

  return NextResponse.json(data);
} 
