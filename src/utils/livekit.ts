const ANDROID_LIVEKIT_WS_URL = 'wss://flixtrend-vobztfm3.livekit.cloud';

export const livekitStreamUrl =
  process.env.NEXT_PUBLIC_LIVEKIT_WS_URL || ANDROID_LIVEKIT_WS_URL;

export const livekitCallUrl = ANDROID_LIVEKIT_WS_URL;
