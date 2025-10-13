
import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flixtrend.in';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'FlixTrend',
    template: '%s | FlixTrend',
  },
  description: 'FlixTrend: The Future of Social, Built for Gen-Z. Secure, Creative, Connected. Where trends find you first.',
  manifest: "/manifest.json",
  keywords: ['FlixTrend', 'social media', 'Gen-Z', 'video sharing', 'live streaming', 'secure social', 'Indian social media', 'flashes', 'vibes', 'vibesapce', 'scope'],
  openGraph: {
    title: 'FlixTrend',
    description: 'The Future of Social, Built for Gen-Z. Secure, Creative, Connected.',
    url: siteUrl,
    siteName: 'FlixTrend',
    images: [
      {
        url: '/og-image.png', // Using a more standard OG image name
        width: 1200,
        height: 630,
        alt: 'FlixTrend - The Future of Social',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlixTrend: The Vibe is Here.',
    description: 'The Future of Social, Built for Gen-Z. Secure, Creative, Connected.',
    creator: '@FlxTrnd',
    site: '@FlxTrnd',
    images: [`${siteUrl}/og-image.png`],
  },
  icons: {
    icon: '/apple-touch-icon.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#1B1B1E" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Space+Grotesk:wght@700&family=Italianno&family=Dancing+Script:wght@400..700&family=Great+Vibes&display=swap" rel="stylesheet" />
        <script src="https://pay.google.com/gp/p/js/pay.js" async></script>
        
      </head>
      <body className="relative min-h-screen">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
