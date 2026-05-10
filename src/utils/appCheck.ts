import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

/**
 * Initializes Firebase App Check with reCAPTCHA v3.
 * 
 * NOTE: Ensure 'NEXT_PUBLIC_RECAPTCHA_SITE_KEY' is set in your .env.local file.
 * This function should be called once on the client-side.
 */
export function initAppCheck(app: ReturnType<typeof initializeApp>) {
  // Bail out if we're on the server.
  if (typeof window === 'undefined') return;

  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!siteKey) {
    console.warn('[AppCheck] NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set. App Check is disabled.');
    return;
  }

  // Use the debug token for local development to bypass reCAPTCHA.
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true, // Auto-refresh tokens on expiration.
    });
  } catch (err) {
    console.error("[AppCheck] Failed to initialize App Check:", err)
  }
}
