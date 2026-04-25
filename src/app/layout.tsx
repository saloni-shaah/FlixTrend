
import "../styles/globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";
import BodyStyling from "./BodyStyling";
import MainLayout from './MainLayout';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flixtrend.in';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'FlixTrend: The clean side of the internet.',
    template: '%s | FlixTrend',
  },
  description: 'FlixTrend: A cleaner, more positive online experience. The Future of Social, Built for Gen-Z. Secure, Creative, Connected.',
  manifest: "/manifest.json",
  keywords: [
    'FlixTrend', 'social media', 'Gen-Z', 'video sharing', 'live streaming', 
    'secure social', 'Indian social media', 'clean internet', 'positive social media', 
    'safe browsing', 'family-friendly content', 'ethical social media', 'digital wellness', 
    'mindful scrolling', 'non-toxic social media', 'flashes', 'vibes', 'vibespace', 'flow'
  ],
  openGraph: {
    title: 'FlixTrend: The clean side of the internet.',
    description: 'A cleaner, more positive online experience. The Future of Social, Built for Gen-Z.',
    url: siteUrl,
    siteName: 'FlixTrend',
    images: [
      {
        url: '/og-image.png', 
        width: 1200,
        height: 630,
        alt: 'FlixTrend - The clean side of the internet.',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlixTrend: The clean side of the internet.',
    description: 'A cleaner, more positive online experience, built for Gen-Z.',
    creator: '@FlxTrnd',
    site: '@FlxTrnd',
    images: [`${siteUrl}/og-image.png`],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
        { url: '/apple-touch-icon.png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const themeScript = `
    (function() {
      try {
        const theme = localStorage.getItem('theme');
        if (theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark');
        }

        const simpleMode = localStorage.getItem('simpleMode');
        if (simpleMode === 'true') {
          document.documentElement.classList.add('simple');
        }

        const accentColor = localStorage.getItem('accentColor');
        if (accentColor) {
            document.documentElement.style.setProperty('--accent-cyan', accentColor);
            document.documentElement.style.setProperty('--brand-saffron', accentColor);
        }
      } catch (e) {
        console.error('Failed to set theme from localStorage', e);
      }
    })();
  `;

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'FlixTrend',
    url: siteUrl,
    logo: `${siteUrl}/icon.svg`,
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <meta name="theme-color" content="#1B1B1E" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Courgette&family=Kalam&family=Handlee&family=Patrick+Hand&family=Inter:wght@400;700&family=Space+Grotesk:wght@700&family=Italianno&family=Dancing+Script:wght@400..700&family=Great+Vibes&display=swap" rel="stylesheet" />
      </head>
      <body className="relative min-h-screen">
        <Providers>
            <BodyStyling />
            <MainLayout>{children}</MainLayout>
        </Providers>
      </body>
    </html>
  );
}
