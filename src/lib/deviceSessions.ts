const sessionStorageKey = 'flixtrend-device-session-id';
let fallbackSessionId: string | null = null;

export interface DeviceSession {
  id: string;
  label?: string;
  userAgent?: string;
  lastSeen?: { toDate: () => Date } | null;
  createdAt?: { toDate: () => Date } | null;
}

export function getDeviceSessionId(): string {
  try {
    const existingId = window.localStorage.getItem(sessionStorageKey);
    if (existingId) return existingId;

    const sessionId = crypto.randomUUID();
    window.localStorage.setItem(sessionStorageKey, sessionId);
    return sessionId;
  } catch (error) {
    console.error('Could not persist this device session ID:', error);
    fallbackSessionId ??= crypto.randomUUID();
    return fallbackSessionId;
  }
}

export function getDeviceLabel(): string {
  const userAgent = navigator.userAgent;
  const browser = /Edg\//.test(userAgent)
    ? 'Microsoft Edge'
    : /Firefox\//.test(userAgent)
      ? 'Firefox'
      : /Chrome\//.test(userAgent)
        ? 'Chrome'
        : /Safari\//.test(userAgent) && !/Chrome\//.test(userAgent)
          ? 'Safari'
          : 'Web browser';
  const platform = /Android/.test(userAgent)
    ? 'Android'
    : /iPhone|iPad|iPod/.test(userAgent)
      ? 'iOS'
      : /Windows/.test(userAgent)
        ? 'Windows'
        : /Mac OS/.test(userAgent)
          ? 'macOS'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : 'Unknown device';

  return `${browser} on ${platform}`;
}
