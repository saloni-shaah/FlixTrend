
'use server';
import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { roomName, identity, name, isStreamer } = await req.json();

  if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET || !process.env.NEXT_PUBLIC_LIVEKIT_WS_URL) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: identity,
    name: name,
  });

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: isStreamer,
    canSubscribe: true,
    canPublishData: true,
  });

  const token = await at.toJwt();
  
  return NextResponse.json({ token: token });
}
